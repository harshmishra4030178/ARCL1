import mongoose from "mongoose";
import Expense from "../../models/Expense.js";
import ExpenseNotification from "../../models/ExpenseNotification.js";
import User from "../../models/userModel.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import cloudinary from "../../config/cloudinary.js";

/**
 * Upload receipt buffer helper (Uploads to Cloudinary with reliable data-URI fallback)
 */
const uploadReceiptBuffer = async (fileBuffer, mimetype, originalname = "receipt.jpg") => {
  const mime = mimetype || "image/jpeg";
  const base64 = fileBuffer.toString("base64");
  const dataUri = `data:${mime};base64,${base64}`;

  try {
    const cleanPublicId = `EXP_RECEIPT_${Date.now()}_${originalname.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "arcl_expenses",
          resource_type: mime === "application/pdf" ? "raw" : "auto",
          public_id: cleanPublicId,
        },
        (error, res) => {
          if (error) return reject(error);
          resolve(res?.secure_url);
        }
      );
      stream.end(fileBuffer);
    });

    if (result) return result;
  } catch (err) {
    console.warn("Cloudinary expense upload notice, using data-URI fallback:", err.message);
  }

  return dataUri;
};

/**
 * Helper to get local day boundaries (00:00:00 to 23:59:59.999)
 */
const getDayRange = (dateInput = new Date()) => {
  const start = new Date(dateInput);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dateInput);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

// =========================================================================
// 1. CREATE EXPENSE
// =========================================================================
export const createExpense = asyncHandler(async (req, res) => {
  let user = req.user;
  if (!user) {
    if (req.body.userId && mongoose.Types.ObjectId.isValid(req.body.userId)) {
      user = await User.findById(req.body.userId).lean();
    }
    if (!user) {
      user = await User.findOne({ isActive: true }).lean();
    }
    if (!user) {
      user = {
        _id: new mongoose.Types.ObjectId(),
        name: req.body.userName || "Admin Staff",
        email: req.body.userEmail || "staff@arclinstruments.com",
        role: "admin",
      };
    }
  }

  const {
    amount,
    category,
    title,
    description,
    expenseDate,
    paymentMode,
    isReimbursementClaim,
  } = req.body;

  if (amount === undefined || amount === null || isNaN(Number(amount)) || Number(amount) < 0) {
    throw new ApiError(400, "Please provide a valid non-negative expense amount");
  }

  if (!title || !title.trim()) {
    throw new ApiError(400, "Please provide an expense purpose/title");
  }

  let receiptUrl = "";
  let receiptOriginalName = "";

  if (req.file) {
    receiptOriginalName = req.file.originalname;
    receiptUrl = await uploadReceiptBuffer(req.file.buffer, req.file.mimetype, req.file.originalname);
  } else if (req.body.receiptUrl) {
    receiptUrl = req.body.receiptUrl;
    receiptOriginalName = req.body.receiptOriginalName || "Attached Receipt";
  }

  const parsedAmount = Number(amount);
  const parsedDate = expenseDate ? new Date(expenseDate) : new Date();
  const isClaim = Boolean(isReimbursementClaim === true || isReimbursementClaim === "true");

  const d = parsedDate;
  const yearMonth = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  const totalCount = await Expense.countDocuments();
  const generatedCode = `EXP-${yearMonth}-${String(totalCount + 1).padStart(4, "0")}-${rand}`;

  const newExpense = await Expense.create({
    expenseCode: generatedCode,
    userId: user._id,
    userName: user.name || "Admin Staff",
    userEmail: user.email || "staff@arclinstruments.com",
    userRole: user.role || "admin",
    userPicture: user.picture || "",
    amount: parsedAmount,
    category: category || "Travel & Conveyance",
    title: title.trim(),
    description: description ? description.trim() : "",
    expenseDate: parsedDate,
    paymentMode: paymentMode || "Company UPI / Card",
    receiptUrl,
    receiptOriginalName,
    isReimbursementClaim: isClaim,
    status: isClaim ? "Pending" : "Approved",
    isZeroExpenseDay: parsedAmount === 0,
  });

  // BROADCAST NOTIFICATION TO ALL REGISTERED ADMINS & STAFF
  try {
    const formattedAmount = `₹${parsedAmount.toLocaleString("en-IN")}`;
    const notificationMessage = parsedAmount > 0
      ? `${user.name} recorded an expense of ${formattedAmount} for "${title.trim()}" (${category || "General"}).`
      : `${user.name} confirmed no company expenses incurred for today.`;

    await ExpenseNotification.create({
      type: parsedAmount > 0 ? "NEW_EXPENSE" : "ZERO_EXPENSE_LOGGED",
      title: parsedAmount > 0 ? `New Expense: ${formattedAmount}` : "Daily Expense: ₹0 Confirmed",
      message: notificationMessage,
      amount: parsedAmount,
      category: category || "General",
      expenseId: newExpense._id,
      createdByUserId: user._id,
      createdByName: user.name,
      createdByPicture: user.picture || "",
      targetUserId: null, // Broadcast to all
      readBy: [user._id], // Creator has already read it
      link: "/admin/expenses",
    });
  } catch (notifErr) {
    console.warn("Async expense notification broadcast warning:", notifErr.message);
  }

  return res.status(201).json(
    new ApiResponse(201, newExpense, "Expense recorded successfully and broadcasted to team!")
  );
});

// =========================================================================
// 2. QUICK LOG ZERO-EXPENSE DAY (1-Click Daily Confirmation)
// =========================================================================
export const logZeroExpenseToday = asyncHandler(async (req, res) => {
  let user = req.user;
  if (!user) {
    if (req.body?.userId && mongoose.Types.ObjectId.isValid(req.body.userId)) {
      user = await User.findById(req.body.userId).lean();
    }
    if (!user) {
      user = await User.findOne({ isActive: true }).lean();
    }
    if (!user) {
      user = {
        _id: new mongoose.Types.ObjectId(),
        name: req.body?.userName || "Admin Staff",
        email: req.body?.userEmail || "staff@arclinstruments.com",
        role: "admin",
      };
    }
  }

  const { start, end } = getDayRange(new Date());

  // Check if an expense or zero-expense entry already exists for today
  const existing = await Expense.findOne({
    userId: user._id,
    expenseDate: { $gte: start, $lte: end },
  });

  if (existing) {
    return res.status(200).json(
      new ApiResponse(200, existing, "You have already logged an expense entry for today.")
    );
  }

  const d = new Date();
  const yearMonth = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  const rand = Math.floor(1000 + Math.random() * 9000);
  const totalCount = await Expense.countDocuments();
  const generatedCode = `EXP-${yearMonth}-${String(totalCount + 1).padStart(4, "0")}-${rand}`;

  const zeroExpense = await Expense.create({
    expenseCode: generatedCode,
    userId: user._id,
    userName: user.name || "Admin Staff",
    userEmail: user.email || "staff@arclinstruments.com",
    userRole: user.role || "admin",
    userPicture: user.picture || "",
    amount: 0,
    category: "Miscellaneous",
    title: "No Company Expenses Incurred Today",
    description: "Daily automated confirmation: Zero expenditure incurred.",
    expenseDate: new Date(),
    paymentMode: "Company UPI / Card",
    isZeroExpenseDay: true,
    status: "Approved",
  });

  return res.status(201).json(
    new ApiResponse(201, zeroExpense, "Today marked as Zero Expense Day! Daily alert cleared.")
  );
});

// =========================================================================
// 3. GET EXPENSES (With Rich Filters, Search & Summary Stats)
// =========================================================================
export const getExpenses = asyncHandler(async (req, res) => {
  const {
    userId,
    category,
    status,
    datePreset,
    startDate,
    endDate,
    search,
    page = 1,
    limit = 50,
  } = req.query;

  const query = {};

  // Specific User Filter
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    query.userId = new mongoose.Types.ObjectId(userId);
  }

  // Category Filter
  if (category && category !== "all") {
    query.category = category;
  }

  // Status Filter
  if (status && status !== "all") {
    query.status = status;
  }

  // Date Filtering
  const now = new Date();
  if (datePreset) {
    if (datePreset === "today") {
      const { start, end } = getDayRange(now);
      query.expenseDate = { $gte: start, $lte: end };
    } else if (datePreset === "yesterday") {
      const yest = new Date(now);
      yest.setDate(yest.getDate() - 1);
      const { start, end } = getDayRange(yest);
      query.expenseDate = { $gte: start, $lte: end };
    } else if (datePreset === "7d") {
      const start = new Date(now);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      query.expenseDate = { $gte: start, $lte: now };
    } else if (datePreset === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      query.expenseDate = { $gte: start, $lte: end };
    } else if (datePreset === "all") {
      // All time - no date restriction
    } else if (datePreset === "last_month") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      query.expenseDate = { $gte: start, $lte: end };
    } else if (datePreset === "quarter") {
      const start = new Date(now);
      start.setMonth(start.getMonth() - 3);
      start.setHours(0, 0, 0, 0);
      query.expenseDate = { $gte: start, $lte: now };
    } else if (datePreset === "year") {
      const start = new Date(now.getFullYear(), 0, 1);
      query.expenseDate = { $gte: start, $lte: now };
    } else if (datePreset === "custom" && startDate && endDate) {
      const s = new Date(startDate);
      s.setHours(0, 0, 0, 0);
      const e = new Date(endDate);
      e.setHours(23, 59, 59, 999);
      query.expenseDate = { $gte: s, $lte: e };
    }
  } else if (startDate && endDate) {
    const s = new Date(startDate);
    s.setHours(0, 0, 0, 0);
    const e = new Date(endDate);
    e.setHours(23, 59, 59, 999);
    query.expenseDate = { $gte: s, $lte: e };
  }

  // Search keyword (Title, Description, Staff Name, Code)
  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), "i");
    query.$or = [
      { title: regex },
      { description: regex },
      { userName: regex },
      { userEmail: regex },
      { expenseCode: regex },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(200, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const [expenses, totalCount, summaryAgg] = await Promise.all([
    Expense.find(query)
      .sort({ expenseDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Expense.countDocuments(query),
    Expense.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          pendingReimbursements: {
            $sum: {
              $cond: [{ $and: ["$isReimbursementClaim", { $eq: ["$status", "Pending"] }] }, "$amount", 0],
            },
          },
          approvedCount: {
            $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] },
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  const summary = summaryAgg[0] || {
    totalAmount: 0,
    pendingReimbursements: 0,
    approvedCount: 0,
    pendingCount: 0,
  };

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        expenses,
        pagination: {
          total: totalCount,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(totalCount / limitNum) || 1,
        },
        summary,
      },
      "Expenses retrieved successfully"
    )
  );
});

// =========================================================================
// 4. GET REGISTERED STAFF EXPENSE ACCOUNTS (Individual Ledger Summary)
// =========================================================================
export const getUserExpenseAccounts = asyncHandler(async (req, res) => {
  const users = await User.find({})
    .select("name email role picture isActive createdAt lastActiveAt lastLogin")
    .sort({ createdAt: -1 })
    .lean();

  const now = new Date();
  const { start: todayStart, end: todayEnd } = getDayRange(now);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Aggregate user statistics
  const userAggregations = await Expense.aggregate([
    {
      $facet: {
        allTime: [
          {
            $group: {
              _id: "$userId",
              totalAmount: { $sum: "$amount" },
              count: { $sum: 1 },
              pendingReimbursements: {
                $sum: {
                  $cond: [{ $and: ["$isReimbursementClaim", { $eq: ["$status", "Pending"] }] }, "$amount", 0],
                },
              },
            },
          },
        ],
        thisMonth: [
          { $match: { expenseDate: { $gte: monthStart } } },
          {
            $group: {
              _id: "$userId",
              monthAmount: { $sum: "$amount" },
              monthCount: { $sum: 1 },
            },
          },
        ],
        today: [
          { $match: { expenseDate: { $gte: todayStart, $lte: todayEnd } } },
          {
            $group: {
              _id: "$userId",
              todayAmount: { $sum: "$amount" },
              todayCount: { $sum: 1 },
              hasZeroDay: { $max: "$isZeroExpenseDay" },
            },
          },
        ],
      },
    },
  ]);

  const allTimeMap = new Map();
  const thisMonthMap = new Map();
  const todayMap = new Map();

  if (userAggregations.length > 0) {
    userAggregations[0].allTime.forEach((it) => allTimeMap.set(String(it._id), it));
    userAggregations[0].thisMonth.forEach((it) => thisMonthMap.set(String(it._id), it));
    userAggregations[0].today.forEach((it) => todayMap.set(String(it._id), it));
  }

  const accounts = users.map((u) => {
    const uId = String(u._id);
    const allStats = allTimeMap.get(uId) || { totalAmount: 0, count: 0, pendingReimbursements: 0 };
    const monthStats = thisMonthMap.get(uId) || { monthAmount: 0, monthCount: 0 };
    const todayStats = todayMap.get(uId) || null;

    let todayStatus = "PENDING_ALERT";
    if (todayStats) {
      todayStatus = todayStats.todayAmount > 0 ? "LOGGED_EXPENSE" : "LOGGED_ZERO";
    }

    return {
      userId: u._id,
      name: u.name,
      email: u.email,
      role: u.role,
      picture: u.picture,
      allTimeTotal: allStats.totalAmount || 0,
      allTimeCount: allStats.count || 0,
      thisMonthTotal: monthStats.monthAmount || 0,
      thisMonthCount: monthStats.monthCount || 0,
      todayAmount: todayStats ? todayStats.todayAmount : 0,
      todayStatus,
      pendingReimbursements: allStats.pendingReimbursements || 0,
    };
  });

  return res.status(200).json(
    new ApiResponse(200, accounts, "Staff expense accounts retrieved successfully")
  );
});

// =========================================================================
// 5. GET CURRENT USER DAILY STATUS & REMINDER
// =========================================================================
export const getUserDailyStatus = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) throw new ApiError(401, "Authentication required");

  const { start, end } = getDayRange(new Date());

  const todayEntries = await Expense.find({
    userId: user._id,
    expenseDate: { $gte: start, $lte: end },
  }).sort({ createdAt: -1 });

  const hasLoggedToday = todayEntries.length > 0;
  const todayTotal = todayEntries.reduce((sum, item) => sum + (item.amount || 0), 0);
  const isZeroDay = todayEntries.some((item) => item.isZeroExpenseDay);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        hasLoggedToday,
        todayTotal,
        isZeroDay,
        entriesCount: todayEntries.length,
        todayEntries,
        prompt: !hasLoggedToday
          ? "Daily Expense Reminder: You have not recorded any company expense for today. Please log today's expenditures or confirm 'No Expense Today'."
          : "Today's expense status is complete.",
      },
      "User daily expense status checked"
    )
  );
});

// =========================================================================
// 6. GET EXPENSE NOTIFICATIONS FEED
// =========================================================================
export const getExpenseNotifications = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) throw new ApiError(401, "Authentication required");

  // Notifications targeted to this user or broadcast to all (targetUserId: null)
  const query = {
    $or: [{ targetUserId: null }, { targetUserId: user._id }],
  };

  const notifications = await ExpenseNotification.find(query)
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const unreadCount = notifications.filter(
    (n) => !n.readBy || !n.readBy.some((rId) => String(rId) === String(user._id))
  ).length;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        notifications,
        unreadCount,
      },
      "Expense notifications retrieved"
    )
  );
});

// =========================================================================
// 7. MARK NOTIFICATION AS READ
// =========================================================================
export const markExpenseNotificationRead = asyncHandler(async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  if (id === "all") {
    await ExpenseNotification.updateMany(
      { $or: [{ targetUserId: null }, { targetUserId: user._id }] },
      { $addToSet: { readBy: user._id } }
    );
  } else if (mongoose.Types.ObjectId.isValid(id)) {
    await ExpenseNotification.findByIdAndUpdate(id, {
      $addToSet: { readBy: user._id },
    });
  }

  return res.status(200).json(new ApiResponse(200, null, "Notification marked as read"));
});

// =========================================================================
// 8. UPDATE EXPENSE STATUS (Approve / Reject / Reimburse)
// =========================================================================
export const updateExpenseStatus = asyncHandler(async (req, res) => {
  const user = req.user;
  const { id } = req.params;
  const { status, reviewNotes } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid expense ID");
  }

  const validStatuses = ["Approved", "Pending", "Rejected", "Reimbursed"];
  if (!validStatuses.includes(status)) {
    throw new ApiError(400, `Status must be one of: ${validStatuses.join(", ")}`);
  }

  const expense = await Expense.findById(id);
  if (!expense) throw new ApiError(404, "Expense record not found");

  expense.status = status;
  expense.reviewedBy = user.name || "Administrator";
  expense.reviewedAt = new Date();
  if (reviewNotes) expense.reviewNotes = reviewNotes.trim();

  await expense.save();

  // If status is Reimbursed or Rejected, notify the owner specifically
  if (status === "Reimbursed" || status === "Rejected") {
    try {
      await ExpenseNotification.create({
        type: "EXPENSE_REIMBURSED",
        title: `Expense ${status}: ₹${expense.amount.toLocaleString("en-IN")}`,
        message: `Your expense "${expense.title}" was marked as ${status} by ${user.name}.`,
        amount: expense.amount,
        category: expense.category,
        expenseId: expense._id,
        createdByUserId: user._id,
        createdByName: user.name,
        targetUserId: expense.userId,
        link: "/admin/expenses",
      });
    } catch (e) {}
  }

  return res.status(200).json(
    new ApiResponse(200, expense, `Expense status updated to ${status}`)
  );
});

// =========================================================================
// 9. DELETE EXPENSE
// =========================================================================
export const deleteExpense = asyncHandler(async (req, res) => {
  const user = req.user;
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid expense ID");
  }

  const expense = await Expense.findById(id);
  if (!expense) throw new ApiError(404, "Expense not found");

  // Only superadmin, admin, or the creator can delete
  const isSuper = user.role === "superadmin";
  const isOwner = String(expense.userId) === String(user._id);

  if (!isSuper && !isOwner && user.role !== "admin") {
    throw new ApiError(403, "You do not have permission to delete this expense");
  }

  await Expense.findByIdAndDelete(id);

  return res.status(200).json(new ApiResponse(200, null, "Expense deleted successfully"));
});

// =========================================================================
// 10. EXPORT EXPENSES CSV
// =========================================================================
export const exportExpensesCsv = asyncHandler(async (req, res) => {
  const { userId, datePreset, startDate, endDate, category, status } = req.query;

  const query = {};
  if (userId && mongoose.Types.ObjectId.isValid(userId)) {
    query.userId = new mongoose.Types.ObjectId(userId);
  }
  if (category && category !== "all") query.category = category;
  if (status && status !== "all") query.status = status;

  const now = new Date();
  if (datePreset === "today") {
    const { start, end } = getDayRange(now);
    query.expenseDate = { $gte: start, $lte: end };
  } else if (datePreset === "7d") {
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    query.expenseDate = { $gte: start, $lte: now };
  } else if (datePreset === "month") {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    query.expenseDate = { $gte: start, $lte: now };
  } else if (startDate && endDate) {
    const s = new Date(startDate);
    s.setHours(0, 0, 0, 0);
    const e = new Date(endDate);
    e.setHours(23, 59, 59, 999);
    query.expenseDate = { $gte: s, $lte: e };
  }

  const expenses = await Expense.find(query).sort({ expenseDate: -1 }).lean();

  const headers = [
    "Expense Code",
    "Date",
    "Staff Name",
    "Staff Email",
    "Role",
    "Category",
    "Purpose / Title",
    "Amount (INR)",
    "Payment Mode",
    "Reimbursement Claim",
    "Status",
    "Remarks",
    "Receipt Attached",
  ];

  const rows = expenses.map((e) => [
    e.expenseCode || "EXP",
    e.expenseDate ? new Date(e.expenseDate).toLocaleDateString("en-IN") : "",
    `"${(e.userName || "").replace(/"/g, '""')}"`,
    e.userEmail || "",
    e.userRole || "",
    `"${(e.category || "").replace(/"/g, '""')}"`,
    `"${(e.title || "").replace(/"/g, '""')}"`,
    e.amount || 0,
    `"${(e.paymentMode || "").replace(/"/g, '""')}"`,
    e.isReimbursementClaim ? "Yes" : "No",
    e.status || "Approved",
    `"${(e.description || "").replace(/"/g, '""')}"`,
    e.receiptUrl ? "Yes" : "No",
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=ARCL_Expenses_${Date.now()}.csv`
  );

  return res.status(200).send(csvContent);
});
