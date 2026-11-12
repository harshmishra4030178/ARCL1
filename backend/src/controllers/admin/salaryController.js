import SalaryStructure from "../../models/SalaryStructure.js";
import SalaryPayment from "../../models/SalaryPayment.js";
import SalaryAdvance from "../../models/SalaryAdvance.js";
import User from "../../models/userModel.js";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { numberToIndianWords } from "../../utils/numberToWords.js";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// ==========================================
// 1. SALARY STRUCTURES (EMPLOYEE PACKAGES)
// ==========================================

export const getSalaryStructures = asyncHandler(async (req, res) => {
  const structures = await SalaryStructure.find()
    .populate("user", "name email phone role isActive avatar")
    .sort({ employeeName: 1 });

  // Also fetch all active users so admin knows who hasn't been set up yet
  const allUsers = await User.find({ isActive: true })
    .select("name email phone role avatar")
    .sort({ name: 1 });

  const structuredUserIds = new Set(structures.map((s) => s.user?._id?.toString() || s.user?.toString()));
  const unconfiguredUsers = allUsers.filter((u) => !structuredUserIds.has(u._id.toString()));

  return res.status(200).json(
    new ApiResponse(
      200,
      { structures, unconfiguredUsers, totalCount: structures.length },
      "Salary structures fetched successfully"
    )
  );
});

export const upsertSalaryStructure = asyncHandler(async (req, res) => {
  let {
    userId,
    employeeCode,
    employeeName,
    email,
    phone,
    designation,
    department,
    joiningDate,
    status,
    monthlyCtc,
    earnings,
    deductions,
    bankDetails,
    notes,
  } = req.body;

  let targetUserId = userId;

  // If no existing user selected, auto-create employee user profile
  if (!targetUserId) {
    const empName = (employeeName || "").trim();
    if (!empName) {
      throw new ApiError(400, "Employee Name is required");
    }

    const empCode = employeeCode ? employeeCode.toUpperCase().trim() : `ARCL-EMP-${Math.floor(100 + Math.random() * 900)}`;
    const empEmail = (email && email.trim()) 
      ? email.trim().toLowerCase() 
      : `${empName.toLowerCase().replace(/[^a-z0-9]/g, "")}.${empCode.toLowerCase()}@arclinstruments.com`;

    let user = await User.findOne({ email: empEmail });
    if (!user) {
      user = await User.create({
        name: empName,
        email: empEmail,
        phone: phone || "",
        role: "user",
        isActive: true,
      });
    }
    targetUserId = user._id;
  }

  const user = await User.findById(targetUserId);
  if (!user) {
    throw new ApiError(404, "Employee user profile not found");
  }

  const empName = employeeName || user.name || "Employee";
  const empCode = employeeCode ? employeeCode.toUpperCase().trim() : `ARCL-EMP-${String(targetUserId).slice(-4).toUpperCase()}`;

  // Check code uniqueness with other employees
  const existingCode = await SalaryStructure.findOne({ employeeCode: empCode, user: { $ne: targetUserId } });
  if (existingCode) {
    throw new ApiError(400, `Employee code ${empCode} is already assigned to another staff member`);
  }

  // Calculate default breakdown if not fully provided
  const ctc = Number(monthlyCtc) || 25000;
  const basic = earnings?.basic !== undefined ? Number(earnings.basic) : Math.round(ctc * 0.5);
  const hra = earnings?.hra !== undefined ? Number(earnings.hra) : Math.round(basic * 0.4);
  const conveyance = earnings?.conveyance !== undefined ? Number(earnings.conveyance) : 1600;
  const medicalAllowance = earnings?.medicalAllowance !== undefined ? Number(earnings.medicalAllowance) : 1250;
  const specialAllowance = earnings?.specialAllowance !== undefined ? Number(earnings.specialAllowance) : Math.max(0, ctc - (basic + hra + conveyance + medicalAllowance));
  const performanceBonus = Number(earnings?.performanceBonus) || 0;

  const epfApplicable = deductions?.epfApplicable !== undefined ? deductions.epfApplicable : true;
  const epfAmount = epfApplicable ? (deductions?.epfAmount !== undefined ? Number(deductions.epfAmount) : Math.round(basic * 0.12)) : 0;

  const esiApplicable = deductions?.esiApplicable !== undefined ? deductions.esiApplicable : (ctc <= 21000);
  const esiAmount = esiApplicable ? (deductions?.esiAmount !== undefined ? Number(deductions.esiAmount) : Math.round(ctc * 0.0075)) : 0;
  const professionalTax = deductions?.professionalTax !== undefined ? Number(deductions.professionalTax) : 200;
  const tds = Number(deductions?.tds) || 0;

  const structure = await SalaryStructure.findOneAndUpdate(
    { user: targetUserId },
    {
      $set: {
        user: targetUserId,
        employeeCode: empCode,
        employeeName: empName,
        designation: designation || "Calibration Engineer",
        department: department || "Calibration Lab",
        joiningDate: joiningDate || Date.now(),
        status: status || "active",
        monthlyCtc: ctc,
        earnings: {
          basic,
          hra,
          conveyance,
          medicalAllowance,
          specialAllowance,
          performanceBonus,
        },
        deductions: {
          epfApplicable,
          epfAmount,
          esiApplicable,
          esiAmount,
          professionalTax,
          tds,
        },
        bankDetails: {
          bankName: bankDetails?.bankName || "",
          accountHolderName: bankDetails?.accountHolderName || empName,
          accountNumber: bankDetails?.accountNumber || "",
          ifscCode: (bankDetails?.ifscCode || "").toUpperCase(),
          upiId: bankDetails?.upiId || "",
          panNumber: (bankDetails?.panNumber || "").toUpperCase(),
          uanNumber: bankDetails?.uanNumber || "",
          esiNumber: bankDetails?.esiNumber || "",
        },
        notes: notes || "",
      },
    },
    { new: true, upsert: true, runValidators: true }
  ).populate("user", "name email phone role avatar");

  return res.status(200).json(
    new ApiResponse(200, structure, "Salary structure saved successfully")
  );
});

// ==========================================
// 2. MONTHLY PAYROLL PROCESSING & DISBURSALS
// ==========================================

export const getMonthlyPayroll = asyncHandler(async (req, res) => {
  const now = new Date();
  const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1;
  const year = req.query.year ? Number(req.query.year) : now.getFullYear();
  const status = req.query.status;
  const search = req.query.search;

  const query = { month, year };
  if (status && status !== "all") {
    query.status = status;
  }
  if (search) {
    query.$or = [
      { employeeName: { $regex: search, $options: "i" } },
      { employeeCode: { $regex: search, $options: "i" } },
      { slipNumber: { $regex: search, $options: "i" } },
      { designation: { $regex: search, $options: "i" } },
    ];
  }

  const slips = await SalaryPayment.find(query)
    .populate("user", "name email phone role avatar")
    .populate("paymentDetails.paidBy", "name email")
    .sort({ employeeName: 1 });

  // Calculate summary metrics for the selected month/year
  const allMonthSlips = await SalaryPayment.find({ month, year });
  let totalGrossPayroll = 0;
  let totalNetDisbursed = 0;
  let totalPendingDisbursal = 0;
  let totalEpf = 0;
  let totalEsi = 0;
  let totalTds = 0;
  let totalPt = 0;
  let totalAdvanceDeducted = 0;
  let paidCount = 0;
  let pendingCount = 0;

  for (const s of allMonthSlips) {
    totalGrossPayroll += (s.earnings?.totalGrossEarnings || 0);
    totalEpf += (s.deductions?.epf || 0);
    totalEsi += (s.deductions?.esi || 0);
    totalTds += (s.deductions?.tds || 0);
    totalPt += (s.deductions?.professionalTax || 0);
    totalAdvanceDeducted += (s.deductions?.advanceDeduction || 0);

    if (s.status === "paid") {
      totalNetDisbursed += s.netSalary;
      paidCount++;
    } else {
      totalPendingDisbursal += s.netSalary;
      pendingCount++;
    }
  }

  const totalDeductions = totalEpf + totalEsi + totalTds + totalPt + totalAdvanceDeducted;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        month,
        year,
        periodString: `${MONTH_NAMES[month - 1]} ${year}`,
        slips,
        summary: {
          totalSlips: allMonthSlips.length,
          totalGrossPayroll,
          totalNetDisbursed,
          totalPendingDisbursal,
          totalDeductions,
          breakdown: {
            totalEpf,
            totalEsi,
            totalTds,
            totalPt,
            totalAdvanceDeducted,
          },
          paidCount,
          pendingCount,
        },
      },
      "Monthly payroll retrieved successfully"
    )
  );
});

export const generateMonthlyPayroll = asyncHandler(async (req, res) => {
  const now = new Date();
  const month = req.body.month ? Number(req.body.month) : now.getMonth() + 1;
  const year = req.body.year ? Number(req.body.year) : now.getFullYear();
  const targetUserId = req.body.userId; // Optional: generate for a specific user only
  const periodString = `${MONTH_NAMES[month - 1]} ${year}`;

  // Find all active structures (or specific user's structure)
  const structureQuery = { status: { $in: ["active", "probation"] } };
  if (targetUserId) {
    structureQuery.user = targetUserId;
  }
  const structures = await SalaryStructure.find(structureQuery).populate("user", "name email phone isActive");

  if (!structures.length) {
    throw new ApiError(400, "No active salary structures found to generate payroll. Please setup salary profiles first.");
  }

  const generatedSlips = [];

  for (const struct of structures) {
    // Check if slip already exists for this month/year
    let slip = await SalaryPayment.findOne({ user: struct.user._id, month, year });

    // Look for any active advances with outstanding balance
    const activeAdvance = await SalaryAdvance.findOne({
      user: struct.user._id,
      status: "active",
      balanceAmount: { $gt: 0 },
    });

    const advanceEmi = activeAdvance ? Math.min(activeAdvance.monthlyEmi, activeAdvance.balanceAmount) : 0;

    const earnings = {
      basic: struct.earnings.basic || 0,
      hra: struct.earnings.hra || 0,
      conveyance: struct.earnings.conveyance || 0,
      medicalAllowance: struct.earnings.medicalAllowance || 0,
      specialAllowance: struct.earnings.specialAllowance || 0,
      performanceBonus: struct.earnings.performanceBonus || 0,
      incentive: slip?.earnings?.incentive || 0,
      expenseReimbursement: slip?.earnings?.expenseReimbursement || 0,
      overtimePay: slip?.earnings?.overtimePay || 0,
    };

    const totalGrossEarnings = Object.values(earnings).reduce((a, b) => a + (Number(b) || 0), 0);

    const deductions = {
      epf: struct.deductions.epfApplicable ? struct.deductions.epfAmount || 0 : 0,
      esi: struct.deductions.esiApplicable ? struct.deductions.esiAmount || 0 : 0,
      professionalTax: struct.deductions.professionalTax || 0,
      tds: struct.deductions.tds || 0,
      advanceDeduction: advanceEmi,
      lopDeduction: slip?.deductions?.lopDeduction || 0,
      otherDeductions: slip?.deductions?.otherDeductions || 0,
    };

    const totalDeductions = Object.values(deductions).reduce((a, b) => a + (Number(b) || 0), 0);
    const netSalary = Math.max(0, totalGrossEarnings - totalDeductions);
    const netSalaryInWords = numberToIndianWords(netSalary);

    earnings.totalGrossEarnings = totalGrossEarnings;
    deductions.totalDeductions = totalDeductions;

    const slipNumber = slip?.slipNumber || `SLIP-${year}${String(month).padStart(2, "0")}-${struct.employeeCode.replace(/[^a-zA-Z0-9]/g, "").slice(-4)}`;

    const slipData = {
      slipNumber,
      user: struct.user._id,
      salaryStructure: struct._id,
      employeeCode: struct.employeeCode,
      employeeName: struct.employeeName,
      designation: struct.designation,
      department: struct.department,
      month,
      year,
      periodString,
      attendance: slip?.attendance || {
        totalDays: new Date(year, month, 0).getDate(),
        workingDays: 26,
        presentDays: 26,
        paidLeaves: 0,
        unpaidLeaves: 0,
        overtimeHours: 0,
        overtimePay: 0,
        lopDeduction: 0,
      },
      earnings,
      deductions,
      netSalary,
      netSalaryInWords,
      status: slip?.status || "pending",
      bankSnapshot: {
        bankName: struct.bankDetails?.bankName || "",
        accountNumber: struct.bankDetails?.accountNumber || "",
        ifscCode: struct.bankDetails?.ifscCode || "",
        panNumber: struct.bankDetails?.panNumber || "",
        uanNumber: struct.bankDetails?.uanNumber || "",
      },
      salaryAdvanceRef: activeAdvance ? activeAdvance._id : null,
      notes: slip?.notes || "",
    };

    if (slip) {
      if (slip.status !== "paid") {
        // Only update if not already paid to preserve audit trail
        slip = await SalaryPayment.findByIdAndUpdate(slip._id, { $set: slipData }, { new: true });
      }
    } else {
      slip = await SalaryPayment.create(slipData);
    }

    generatedSlips.push(slip);
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { count: generatedSlips.length, periodString, slips: generatedSlips },
      `Successfully generated payroll for ${generatedSlips.length} employees (${periodString})`
    )
  );
});

export const updateSalarySlip = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { attendance, earnings, deductions, status, notes } = req.body;

  const slip = await SalaryPayment.findById(id);
  if (!slip) {
    throw new ApiError(404, "Salary slip not found");
  }

  if (slip.status === "paid" && req.user?.role !== "superadmin" && req.user?.role !== "developer") {
    throw new ApiError(400, "Cannot edit a paid salary slip. Please contact Super Admin if adjustment is required.");
  }

  // Merge attendance
  if (attendance) {
    slip.attendance = { ...slip.attendance.toObject(), ...attendance };
  }

  // Merge earnings
  if (earnings) {
    const updatedEarnings = { ...slip.earnings.toObject(), ...earnings };
    delete updatedEarnings.totalGrossEarnings;
    const totalGross = Object.values(updatedEarnings).reduce((a, b) => a + (Number(b) || 0), 0);
    updatedEarnings.totalGrossEarnings = totalGross;
    slip.earnings = updatedEarnings;
  }

  // Merge deductions
  if (deductions) {
    const updatedDeductions = { ...slip.deductions.toObject(), ...deductions };
    delete updatedDeductions.totalDeductions;
    const totalDeds = Object.values(updatedDeductions).reduce((a, b) => a + (Number(b) || 0), 0);
    updatedDeductions.totalDeductions = totalDeds;
    slip.deductions = updatedDeductions;
  }

  slip.netSalary = Math.max(0, (slip.earnings?.totalGrossEarnings || 0) - (slip.deductions?.totalDeductions || 0));
  slip.netSalaryInWords = numberToIndianWords(slip.netSalary);

  if (status) slip.status = status;
  if (notes !== undefined) slip.notes = notes;

  await slip.save();

  return res.status(200).json(
    new ApiResponse(200, slip, "Salary slip updated successfully")
  );
});

export const markSalaryPaid = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    paymentDate,
    paymentMode,
    transactionReference,
    paymentRemarks,
  } = req.body;

  const slip = await SalaryPayment.findById(id);
  if (!slip) {
    throw new ApiError(404, "Salary slip not found");
  }

  slip.status = "paid";
  slip.paymentDetails = {
    paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
    paymentMode: paymentMode || "bank_transfer",
    transactionReference: transactionReference || "",
    paidBy: req.user?._id,
    paidByName: req.user?.name || "Admin",
    paymentRemarks: paymentRemarks || "Disbursed via Admin Payroll Portal",
  };

  await slip.save();

  // If there was an advance deduction linked, update the advance recovery
  if (slip.salaryAdvanceRef && slip.deductions?.advanceDeduction > 0) {
    const advance = await SalaryAdvance.findById(slip.salaryAdvanceRef);
    if (advance && advance.status === "active") {
      const recovered = (advance.recoveredAmount || 0) + slip.deductions.advanceDeduction;
      const balance = Math.max(0, advance.amount - recovered);
      advance.recoveredAmount = recovered;
      advance.balanceAmount = balance;
      if (balance <= 0) {
        advance.status = "cleared";
      }
      await advance.save();
    }
  }

  return res.status(200).json(
    new ApiResponse(200, slip, `Salary slip ${slip.slipNumber} marked as PAID`)
  );
});

export const deleteSalarySlip = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const slip = await SalaryPayment.findById(id);
  if (!slip) {
    throw new ApiError(404, "Salary slip not found");
  }

  if (slip.status === "paid" && req.user?.role !== "superadmin" && req.user?.role !== "developer") {
    throw new ApiError(400, "Paid salary slip cannot be deleted. Contact Super Admin.");
  }

  await SalaryPayment.findByIdAndDelete(id);

  return res.status(200).json(
    new ApiResponse(200, null, `Salary slip ${slip.slipNumber} deleted`)
  );
});

// ==========================================
// 3. SALARY ADVANCES & LOANS
// ==========================================

export const getSalaryAdvances = asyncHandler(async (req, res) => {
  const advances = await SalaryAdvance.find()
    .populate("user", "name email phone role avatar")
    .populate("approvedBy", "name email")
    .sort({ createdAt: -1 });

  return res.status(200).json(
    new ApiResponse(200, advances, "Salary advances fetched successfully")
  );
});

export const createSalaryAdvance = asyncHandler(async (req, res) => {
  const { userId, amount, monthlyEmi, tenureMonths, reason, notes } = req.body;

  if (!userId || !amount) {
    throw new ApiError(400, "User and advance amount are required");
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const struct = await SalaryStructure.findOne({ user: userId });
  const employeeCode = struct?.employeeCode || `ARCL-EMP-${String(userId).slice(-4).toUpperCase()}`;

  const advAmount = Number(amount);
  const tenure = Number(tenureMonths) || 1;
  const emi = monthlyEmi ? Number(monthlyEmi) : Math.ceil(advAmount / tenure);

  const advanceCode = `ADV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(100 + Math.random() * 900)}`;

  const advance = await SalaryAdvance.create({
    advanceCode,
    user: userId,
    employeeName: user.name,
    employeeCode,
    amount: advAmount,
    monthlyEmi: emi,
    tenureMonths: tenure,
    recoveredAmount: 0,
    balanceAmount: advAmount,
    reason: reason || "Personal Emergency / Staff Advance",
    status: "active",
    approvedBy: req.user?._id,
    notes: notes || "",
  });

  return res.status(201).json(
    new ApiResponse(201, advance, `Salary advance of ₹${advAmount.toLocaleString()} sanctioned`)
  );
});

export const updateSalaryAdvanceStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status, recoveredAmount, balanceAmount, notes } = req.body;

  const advance = await SalaryAdvance.findById(id);
  if (!advance) {
    throw new ApiError(404, "Salary advance record not found");
  }

  if (status) advance.status = status;
  if (recoveredAmount !== undefined) advance.recoveredAmount = Number(recoveredAmount);
  if (balanceAmount !== undefined) advance.balanceAmount = Number(balanceAmount);
  if (notes !== undefined) advance.notes = notes;

  if (advance.balanceAmount <= 0) {
    advance.status = "cleared";
  }

  await advance.save();

  return res.status(200).json(
    new ApiResponse(200, advance, "Salary advance updated successfully")
  );
});

// ==========================================
// 4. PAYROLL ANALYTICS & STATUTORY
// ==========================================

export const getPayrollAnalytics = asyncHandler(async (req, res) => {
  // Aggregate last 6 months payroll
  const now = new Date();
  const currentYear = now.getFullYear();

  const slips = await SalaryPayment.find({ year: currentYear });

  const monthMap = {};
  for (let m = 1; m <= 12; m++) {
    monthMap[m] = {
      month: m,
      monthName: MONTH_NAMES[m - 1],
      totalGross: 0,
      totalNet: 0,
      totalEpf: 0,
      totalEsi: 0,
      totalTds: 0,
      totalPt: 0,
      paidCount: 0,
      pendingCount: 0,
    };
  }

  for (const s of slips) {
    const m = s.month;
    if (monthMap[m]) {
      monthMap[m].totalGross += (s.earnings?.totalGrossEarnings || 0);
      monthMap[m].totalNet += (s.netSalary || 0);
      monthMap[m].totalEpf += (s.deductions?.epf || 0);
      monthMap[m].totalEsi += (s.deductions?.esi || 0);
      monthMap[m].totalTds += (s.deductions?.tds || 0);
      monthMap[m].totalPt += (s.deductions?.professionalTax || 0);
      if (s.status === "paid") {
        monthMap[m].paidCount++;
      } else {
        monthMap[m].pendingCount++;
      }
    }
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        year: currentYear,
        monthlyTrends: Object.values(monthMap),
      },
      "Payroll analytics retrieved successfully"
    )
  );
});
