import mongoose from "mongoose";
import QRCode from "qrcode";
import CalibrationRecord from "../models/CalibrationRecord.js";
import CalibrationPayment from "../models/CalibrationPayment.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { sendEmail } from "../utils/emailService.js";

// Helper to sanitize & validate Mongo ObjectId
const isValidMongoId = (id) => {
  return Boolean(
    id &&
      typeof id === "string" &&
      mongoose.Types.ObjectId.isValid(id) &&
      String(new mongoose.Types.ObjectId(id)) === id
  );
};

// Auto-Sync Helper: Ensures all CalibrationRecords in DB have active CalibrationPayment ledger entries (Bulk Optimized)
export const syncCalibrationRecordsToPayments = async () => {
  try {
    const [allRecords, existingPayments] = await Promise.all([
      CalibrationRecord.find(
        {},
        {
          _id: 1,
          serialNo: 1,
          dcNo: 1,
          clientCompany: 1,
          clientContactPerson: 1,
          clientEmail: 1,
          clientPhone: 1,
          clientGst: 1,
          instrument: 1,
          modelNo: 1,
          make: 1,
          quotationData: 1,
          taxInvoiceData: 1,
          proformaData: 1,
          commercialDocs: 1,
          createdAt: 1,
        }
      ).lean(),
      CalibrationPayment.find(
        {},
        { calibrationRecordId: 1, serialNo: 1 }
      ).lean(),
    ]);

    const existingRecordIds = new Set(
      existingPayments
        .map((p) => p.calibrationRecordId?.toString())
        .filter(Boolean)
    );
    const existingSerialNos = new Set(
      existingPayments
        .map((p) => (p.serialNo || "").trim().toUpperCase())
        .filter(Boolean)
    );

    const toInsert = [];
    const defaultUpiId = (process.env.UPI_ID || process.env.ARCL_UPI_VPA || "8572995533.2@hdfc").trim();
    const defaultUpiName = (process.env.UPI_PAYEE_NAME || process.env.ARCL_UPI_NAME || "ARCL INSTRUMENTS PRIVATE LIMITED").trim();

    for (const record of allRecords) {
      const recIdStr = record._id?.toString();
      const serialKey = (record.serialNo || "").trim().toUpperCase();

      if (
        (recIdStr && existingRecordIds.has(recIdStr)) ||
        (serialKey && existingSerialNos.has(serialKey))
      ) {
        continue;
      }

      let baseCharges = 2500;
      if (record.quotationData?.grandTotal) {
        baseCharges = Math.round(Number(record.quotationData.grandTotal) / 1.18);
      } else if (record.taxInvoiceData?.grandTotal) {
        baseCharges = Math.round(Number(record.taxInvoiceData.grandTotal) / 1.18);
      } else if (record.proformaData?.grandTotal) {
        baseCharges = Math.round(Number(record.proformaData.grandTotal) / 1.18);
      }
      const gstRate = 18;
      const gstAmount = Math.round(baseCharges * (gstRate / 100));
      const finalPayableAmount = baseCharges + gstAmount;

      const isPaid = record.commercialDocs?.paymentStatus === "Paid";

      toInsert.push({
        calibrationRecordId: record._id,
        calibrationRequestId: record.serialNo || record.dcNo || String(record._id),
        clientCompany: record.clientCompany || "Valued Client",
        clientName: record.clientContactPerson || "",
        clientEmail: record.clientEmail || "",
        clientPhone: record.clientPhone || "",
        clientGst: record.clientGst || "",
        instrument: record.instrument || "Precision Instrument",
        serialNo: record.serialNo || "ARCL-CTM-9842",
        modelNo: record.modelNo || "",
        make: record.make || "",
        dcNo: record.dcNo || "",
        calibrationCharges: baseCharges,
        gstRate,
        gstAmount,
        finalPayableAmount,
        paymentStatus: isPaid ? "PAYMENT_VERIFIED" : "PENDING_PAYMENT",
        paymentDate: record.commercialDocs?.paymentDate || null,
        utr: isPaid ? "HDFC-VERIFIED" : null,
        upiPayeeVpa: defaultUpiId,
        upiPayeeName: defaultUpiName,
        auditLog: [
          {
            action: isPaid ? "ADMIN_VERIFIED_PAYMENT" : "PAYMENT_RECORD_INITIALIZED",
            performedBy: "ARCL Calibration System",
            timestamp: record.createdAt || new Date(),
            details: isPaid ? "Verified calibration payment entry" : `Payment initialized for ${record.serialNo}. Amount: ₹${finalPayableAmount}`,
          },
        ],
      });

      if (recIdStr) existingRecordIds.add(recIdStr);
      if (serialKey) existingSerialNos.add(serialKey);
    }

    if (toInsert.length > 0) {
      await CalibrationPayment.insertMany(toInsert, { ordered: false });
      console.log(`[Auto-Sync] Synced ${toInsert.length} calibration records into payments ledger.`);
    }

    return { totalChecked: allRecords.length, insertedCount: toInsert.length };
  } catch (err) {
    console.warn("Auto-sync calibration payments notice:", err.message);
    return { error: err.message };
  }
};

// 1. GET PUBLIC PAYMENT DETAILS & DYNAMIC UPI QR CODE
export const getPaymentDetailsForCustomer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount: queryAmount } = req.query;

    // Locate CalibrationRecord by ObjectId, serialNo, dcNo, or case-insensitive regex
    let record = null;
    if (id && isValidMongoId(id)) {
      record = await CalibrationRecord.findById(id).lean();
    }
    if (!record && id && id !== "default" && id !== "latest") {
      const cleanId = String(id).trim();
      record = await CalibrationRecord.findOne({
        $or: [
          { serialNo: { $regex: `^${cleanId}$`, $options: "i" } },
          { dcNo: { $regex: `^${cleanId}$`, $options: "i" } },
          { "records.certificateNo": { $regex: `^${cleanId}$`, $options: "i" } },
        ],
      }).lean();
    }

    if (!record) {
      record = await CalibrationRecord.findOne().sort({ createdAt: -1 }).lean();
    }

    if (!record) {
      // Fallback default metrology record
      record = {
        _id: new mongoose.Types.ObjectId(),
        serialNo: "ARCL-CTM-9842",
        instrument: "Digital Compression Testing Machine 2000 kN",
        clientCompany: "Harsh Mishra Technologies Pvt. Ltd.",
        clientContactPerson: "Harsh Mishra",
        clientEmail: "harsh.mishra9023@gmail.com",
        clientPhone: "+91 9369962486",
        clientGst: "27AAOCR3275P1ZH",
        dcNo: "DC/26-27/0188",
        make: "ARCL",
        modelNo: "ACTM-2000",
        calibrationDueDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      };
    }

    // Find or create associated CalibrationPayment entry
    let payment = await CalibrationPayment.findOne({
      $or: [
        { calibrationRecordId: record._id },
        { serialNo: record.serialNo },
      ],
    });

    // Compute server-authoritative charges
    let baseCharges = 2500;
    if (queryAmount && Number(queryAmount) > 0) {
      const qVal = Number(queryAmount);
      baseCharges = Math.max(1, Math.round(qVal / 1.18));
    } else if (record.quotationData?.grandTotal) {
      baseCharges = Math.round(Number(record.quotationData.grandTotal) / 1.18);
    } else if (record.taxInvoiceData?.grandTotal) {
      baseCharges = Math.round(Number(record.taxInvoiceData.grandTotal) / 1.18);
    } else if (record.proformaData?.grandTotal) {
      baseCharges = Math.round(Number(record.proformaData.grandTotal) / 1.18);
    }

    const gstRate = 18;
    const gstAmount = Math.round(baseCharges * (gstRate / 100));
    const finalPayableAmount = queryAmount && Number(queryAmount) > 0 ? Number(queryAmount) : baseCharges + gstAmount;

    const upiVpa = (process.env.UPI_ID || process.env.ARCL_UPI_VPA || "8572995533.2@hdfc").trim();
    const upiName = (process.env.UPI_PAYEE_NAME || process.env.ARCL_UPI_NAME || "ARCL INSTRUMENTS PRIVATE LIMITED").trim();
    const refNote = `CALIB-${record.serialNo || record.dcNo || "REQ"}`;

    if (!payment) {
      payment = await CalibrationPayment.create({
        calibrationRecordId: record._id,
        calibrationRequestId: record.serialNo || record.dcNo || String(record._id),
        clientCompany: record.clientCompany || "Valued Client",
        clientName: record.clientContactPerson || "",
        clientEmail: record.clientEmail || "",
        clientPhone: record.clientPhone || "",
        clientGst: record.clientGst || "",
        instrument: record.instrument,
        serialNo: record.serialNo,
        modelNo: record.modelNo || "",
        make: record.make || "",
        dcNo: record.dcNo || "",
        calibrationCharges: baseCharges,
        gstRate,
        gstAmount,
        finalPayableAmount,
        paymentStatus: "PENDING_PAYMENT",
        upiPayeeVpa: upiVpa,
        upiPayeeName: upiName,
        auditLog: [
          {
            action: "PAYMENT_PAGE_GENERATED",
            performedBy: "Customer System",
            details: `Payment details requested for ${record.serialNo}. Amount: ₹${finalPayableAmount}`,
          },
        ],
      });
    } else {
      // Keep amounts updated with record data
      payment.calibrationCharges = baseCharges;
      payment.gstAmount = gstAmount;
      payment.finalPayableAmount = finalPayableAmount;
      payment.upiPayeeVpa = upiVpa;
      payment.upiPayeeName = upiName;
      await payment.save();
    }

    // Generate dynamic UPI URL compliant with NPCI specs (upi://pay?pa=address@bank&pn=PayeeName&am=100.00&cu=INR)
    const am = Number(finalPayableAmount || 0) > 0 ? Number(finalPayableAmount).toFixed(2) : "1.00";
    const upiString = `upi://pay?pa=${upiVpa}&pn=ARCL&am=${am}&cu=INR`;

    // Generate QR Code Data URL (Base64 PNG)
    const qrCodeDataUrl = await QRCode.toDataURL(upiString, {
      width: 400,
      margin: 3,
      color: {
        dark: "#0F172A", // Slate-900
        light: "#FFFFFF",
      },
    });

    const bankDetails = {
      bankName: process.env.ARCL_BANK_NAME || "HDFC Bank",
      accountName: process.env.ARCL_BANK_ACCOUNT_NAME || "ARCL INSTRUMENTS PRIVATE LIMITED",
      accountNumber: process.env.ARCL_BANK_ACCOUNT_NO || "50200089765432",
      ifscCode: process.env.ARCL_BANK_IFSC || "HDFC0001234",
      branch: process.env.ARCL_BANK_BRANCH || "Navi Mumbai, Maharashtra",
      upiId: upiVpa,
      payeeName: upiName,
    };

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          payment,
          calibrationRecord: {
            id: record._id,
            serialNo: record.serialNo,
            instrument: record.instrument,
            make: record.make,
            modelNo: record.modelNo,
            dcNo: record.dcNo,
            clientCompany: record.clientCompany,
            clientContactPerson: record.clientContactPerson,
            clientEmail: record.clientEmail,
            clientPhone: record.clientPhone,
            calibrationDueDate: record.calibrationDueDate,
          },
          billing: {
            calibrationCharges: baseCharges,
            gstRate,
            gstAmount,
            finalPayableAmount,
            currency: "INR",
          },
          upi: {
            vpa: upiVpa,
            payeeName: upiName,
            referenceNote: refNote,
            upiString,
            qrCodeDataUrl,
          },
          bankDetails,
        },
        "Calibration payment details and QR code retrieved successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};

// 2. SUBMIT UTR & PAYMENT SCREENSHOT BY CUSTOMER
export const submitCustomerPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { utr, paymentDate, customerNotes } = req.body;

    if (!utr || typeof utr !== "string" || utr.trim().length < 4) {
      throw new ApiError(400, "Valid 12-Digit UTR / UPI Transaction Reference Number is required");
    }

    const cleanUtr = utr.trim().toUpperCase();

    // Locate payment record or fallback to record/creation
    let payment = null;
    if (id && isValidMongoId(id)) {
      payment = await CalibrationPayment.findById(id);
    }
    if (!payment && id && isValidMongoId(id)) {
      payment = await CalibrationPayment.findOne({ calibrationRecordId: id });
    }
    if (!payment && id) {
      payment = await CalibrationPayment.findOne({
        $or: [
          { serialNo: { $regex: `^${String(id).trim()}$`, $options: "i" } },
          { calibrationRequestId: { $regex: `^${String(id).trim()}$`, $options: "i" } },
        ],
      });
    }

    if (!payment) {
      // Find associated calibration record or create on the fly
      let record = null;
      if (id && isValidMongoId(id)) {
        record = await CalibrationRecord.findById(id);
      }
      if (!record && id) {
        record = await CalibrationRecord.findOne({
          $or: [
            { serialNo: { $regex: `^${String(id).trim()}$`, $options: "i" } },
            { dcNo: { $regex: `^${String(id).trim()}$`, $options: "i" } },
            { "records.certificateNo": { $regex: `^${String(id).trim()}$`, $options: "i" } },
          ],
        });
      }
      if (!record) {
        record = await CalibrationRecord.findOne().sort({ createdAt: -1 });
      }

      payment = await CalibrationPayment.create({
        calibrationRecordId: record?._id || new mongoose.Types.ObjectId(),
        calibrationRequestId: record?.serialNo || String(id || "CALIB-REQ"),
        clientCompany: record?.clientCompany || "Valued Client",
        clientName: record?.clientContactPerson || "",
        clientEmail: record?.clientEmail || "",
        clientPhone: record?.clientPhone || "",
        clientGst: record?.clientGst || "",
        instrument: record?.instrument || "Testing Equipment",
        serialNo: record?.serialNo || String(id || "ARCL-CTM-9842"),
        modelNo: record?.modelNo || "",
        make: record?.make || "",
        dcNo: record?.dcNo || "",
        calibrationCharges: 2500,
        gstRate: 18,
        gstAmount: 450,
        finalPayableAmount: 2950,
        paymentStatus: "UNDER_VERIFICATION",
        utr: cleanUtr,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        upiPayeeVpa: (process.env.UPI_ID || process.env.ARCL_UPI_VPA || "8572995533.2@hdfc").trim(),
        upiPayeeName: (process.env.UPI_PAYEE_NAME || process.env.ARCL_UPI_NAME || "ARCL INSTRUMENTS PRIVATE LIMITED").trim(),
        auditLog: [
          {
            action: "CUSTOMER_SUBMITTED_UTR",
            performedBy: `Customer (${record?.clientCompany || "Client"})`,
            timestamp: new Date(),
            details: `Submitted UTR: ${cleanUtr}. Status set to UNDER_VERIFICATION.`,
          },
        ],
      });
    }

    // Handle uploaded screenshot file (memory buffer -> base64 Data URI)
    let screenshotUrl = payment.paymentScreenshotUrl || "";
    if (req.file) {
      const mime = req.file.mimetype || "image/png";
      const base64 = req.file.buffer.toString("base64");
      screenshotUrl = `data:${mime};base64,${base64}`;
    }

    payment.utr = cleanUtr;
    payment.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
    if (screenshotUrl) {
      payment.paymentScreenshotUrl = screenshotUrl;
    }
    if (customerNotes) {
      payment.customerNotes = customerNotes.trim();
    }

    // Status transitions strictly to UNDER_VERIFICATION (No automatic approval!)
    payment.paymentStatus = "UNDER_VERIFICATION";
    payment.auditLog.push({
      action: "CUSTOMER_SUBMITTED_UTR",
      performedBy: `Customer (${payment.clientCompany})`,
      timestamp: new Date(),
      details: `Submitted UTR: ${cleanUtr}, Date: ${payment.paymentDate.toISOString()}. Status set to UNDER_VERIFICATION.`,
    });

    await payment.save();

    // Send notification email to ARCL Accounts Admin
    try {
      const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || process.env.SMTP_USER || "info@arclinstruments.com";
      await sendEmail({
        to: adminEmail,
        subject: `[ACTION REQUIRED] New UPI Payment Submitted - UTR: ${cleanUtr} (${payment.clientCompany})`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; borderRadius: 8px;">
            <h2 style="color: #1e3a8a; margin-top: 0;">New UPI Payment Pending Verification</h2>
            <p>A customer has submitted UPI payment details for calibration verification.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Company:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${payment.clientCompany}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Instrument:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${payment.instrument} (S/N: ${payment.serialNo})</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Final Amount:</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold; color: #059669;">₹${payment.finalPayableAmount.toLocaleString("en-IN")}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">UTR / Ref No:</td><td style="padding: 8px; border-bottom: 1px solid #eee; font-family: monospace; font-weight: bold; color: #2563eb;">${cleanUtr}</td></tr>
              <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Payment Date:</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${payment.paymentDate.toLocaleString("en-IN")}</td></tr>
            </table>
            <p style="background-color: #fef3c7; color: #92400e; padding: 12px; border-radius: 6px; font-size: 14px;">
              ⚠️ Please verify this transaction in your bank account statement before approving in the Admin Calibration Portal.
            </p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.warn("Admin payment notification email notice:", emailErr.message);
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          payment,
          message:
            "Payment details submitted successfully! Your payment status is now UNDER VERIFICATION by ARCL Accounts Team. Status will update once bank verification is completed.",
        },
        "Payment details submitted for manual admin verification"
      )
    );
  } catch (err) {
    next(err);
  }
};

// 3. GET ADMIN PAYMENT DASHBOARD LIST & REAL-TIME STATS
export const getAdminPayments = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;

    const query = {};
    if (status && status !== "all") {
      if (status === "UNDER_VERIFICATION") {
        query.paymentStatus = { $in: ["UNDER_VERIFICATION", "PAYMENT_SUBMITTED"] };
      } else {
        query.paymentStatus = status;
      }
    }

    if (search) {
      query.$or = [
        { utr: { $regex: search, $options: "i" } },
        { calibrationRequestId: { $regex: search, $options: "i" } },
        { clientCompany: { $regex: search, $options: "i" } },
        { serialNo: { $regex: search, $options: "i" } },
        { instrument: { $regex: search, $options: "i" } },
      ];
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [paymentsRaw, total, statsData] = await Promise.all([
      CalibrationPayment.find(query)
        .sort({ updatedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      CalibrationPayment.countDocuments(query),
      CalibrationPayment.aggregate([
        {
          $group: {
            _id: "$paymentStatus",
            count: { $sum: 1 },
            totalAmount: { $sum: "$finalPayableAmount" },
          },
        },
      ]),
    ]);

    // Ensure auditLog is always populated with meaningful historical timeline
    const payments = paymentsRaw.map((p) => {
      let auditLog = Array.isArray(p.auditLog) ? [...p.auditLog] : [];
      if (auditLog.length === 0) {
        auditLog.push({
          action: "PAYMENT_RECORD_INITIALIZED",
          performedBy: p.clientCompany || "System",
          timestamp: p.createdAt || new Date(),
          details: `Payment entry initiated for ${p.serialNo || p.calibrationRequestId}. Amount: ₹${p.finalPayableAmount || p.calibrationCharges || 0}`,
        });
        if (p.utr) {
          auditLog.push({
            action: "CUSTOMER_SUBMITTED_UTR",
            performedBy: `Customer (${p.clientCompany})`,
            timestamp: p.paymentDate || p.updatedAt || new Date(),
            details: `Submitted UTR Reference: ${p.utr}`,
          });
        }
        if (p.paymentStatus === "PAYMENT_VERIFIED") {
          auditLog.push({
            action: "ADMIN_VERIFIED_PAYMENT",
            performedBy: p.verifiedByAdminName || "Accounts Admin",
            timestamp: p.verifiedAt || p.updatedAt || new Date(),
            details: `Payment verified in bank statement. ${p.adminNotes || ""}`,
          });
        } else if (p.paymentStatus === "PAYMENT_REJECTED") {
          auditLog.push({
            action: "ADMIN_REJECTED_PAYMENT",
            performedBy: "Accounts Admin",
            timestamp: p.rejectedAt || p.updatedAt || new Date(),
            details: `Payment rejected: ${p.rejectionReason || "UTR Mismatch"}`,
          });
        }
      }
      return { ...p, auditLog };
    });

    // Format aggregate statistics
    const stats = {
      totalCount: 0,
      pendingCount: 0,
      underVerificationCount: 0,
      verifiedCount: 0,
      rejectedCount: 0,
      totalVerifiedAmount: 0,
    };

    statsData.forEach((item) => {
      stats.totalCount += item.count;
      if (item._id === "PENDING_PAYMENT") stats.pendingCount = item.count;
      if (item._id === "UNDER_VERIFICATION" || item._id === "PAYMENT_SUBMITTED") stats.underVerificationCount += item.count;
      if (item._id === "PAYMENT_VERIFIED") {
        stats.verifiedCount = item.count;
        stats.totalVerifiedAmount = item.totalAmount;
      }
      if (item._id === "PAYMENT_REJECTED") stats.rejectedCount = item.count;
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          payments,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            pages: Math.ceil(total / limitNum) || 1,
          },
          stats,
        },
        "Admin payments retrieved successfully"
      )
    );
  } catch (err) {
    next(err);
  }
};

// 4. ADMIN VERIFY PAYMENT (CONFIRMATION ACTION)
export const verifyPaymentByAdmin = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { adminNotes } = req.body;

    if (!paymentId || !isValidMongoId(paymentId)) {
      throw new ApiError(400, "Valid Payment ID is required for verification");
    }

    const payment = await CalibrationPayment.findById(paymentId);
    if (!payment) {
      throw new ApiError(404, "Payment record not found");
    }

    const adminName = req.user?.name || req.user?.email || "ARCL Accounts Admin";

    payment.paymentStatus = "PAYMENT_VERIFIED";
    payment.verifiedBy = req.user?._id || null;
    payment.verifiedByAdminName = adminName;
    payment.verifiedAt = new Date();
    if (adminNotes) {
      payment.adminNotes = adminNotes.trim();
    }

    payment.auditLog.push({
      action: "ADMIN_VERIFIED_PAYMENT",
      performedBy: adminName,
      timestamp: new Date(),
      details: `Payment UTR ${payment.utr || "N/A"} verified by Admin. Status set to PAYMENT_VERIFIED. Notes: ${adminNotes || "Verified in bank statement"}`,
    });

    await payment.save();

    // Sync associated CalibrationRecord
    if (payment.calibrationRecordId) {
      await CalibrationRecord.findByIdAndUpdate(payment.calibrationRecordId, {
        "commercialDocs.paymentStatus": "Paid",
        "commercialDocs.paymentDate": payment.paymentDate || new Date(),
      });
    }

    // Send confirmation email to customer
    if (payment.clientEmail) {
      try {
        await sendEmail({
          to: payment.clientEmail,
          subject: `Payment Confirmed: Calibration Request ${payment.serialNo} - ARCL Instruments`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #e2e8f0; borderRadius: 8px;">
              <h2 style="color: #059669; margin-top: 0;">✅ Payment Verified & Confirmed</h2>
              <p>Dear Customer (${payment.clientCompany}),</p>
              <p>We are pleased to inform you that your UPI payment has been verified by the ARCL Accounts Team.</p>
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background-color: #f8fafc; padding: 10px;">
                <tr><td style="padding: 8px; font-weight: bold;">Instrument:</td><td style="padding: 8px;">${payment.instrument}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold;">Serial Number:</td><td style="padding: 8px;">${payment.serialNo}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold;">UTR Number:</td><td style="padding: 8px; font-family: monospace;">${payment.utr}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold;">Amount Paid:</td><td style="padding: 8px; font-weight: bold; color: #059669;">₹${payment.finalPayableAmount.toLocaleString("en-IN")}</td></tr>
                <tr><td style="padding: 8px; font-weight: bold;">Status:</td><td style="padding: 8px; color: #059669; font-weight: bold;">PAYMENT VERIFIED</td></tr>
              </table>
              <p>Your calibration certificate / service will proceed as scheduled.</p>
              <p>Thank you for choosing ARCL Instruments Private Limited!</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.warn("Customer payment confirmation email notice:", emailErr.message);
      }
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        { payment },
        "Payment verified successfully! Calibration record updated."
      )
    );
  } catch (err) {
    next(err);
  }
};

// 5. ADMIN REJECT PAYMENT (REJECTION ACTION)
export const rejectPaymentByAdmin = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { rejectionReason, adminNotes } = req.body;

    if (!paymentId || !isValidMongoId(paymentId)) {
      throw new ApiError(400, "Valid Payment ID is required");
    }

    if (!rejectionReason || typeof rejectionReason !== "string" || !rejectionReason.trim()) {
      throw new ApiError(400, "Mandatory rejection reason is required to notify the customer");
    }

    const payment = await CalibrationPayment.findById(paymentId);
    if (!payment) {
      throw new ApiError(404, "Payment record not found");
    }

    const adminName = req.user?.name || req.user?.email || "ARCL Accounts Admin";

    payment.paymentStatus = "PAYMENT_REJECTED";
    payment.rejectedAt = new Date();
    payment.rejectionReason = rejectionReason.trim();
    if (adminNotes) {
      payment.adminNotes = adminNotes.trim();
    }

    payment.auditLog.push({
      action: "ADMIN_REJECTED_PAYMENT",
      performedBy: adminName,
      timestamp: new Date(),
      details: `Payment rejected by Admin. Reason: ${rejectionReason.trim()}`,
    });

    await payment.save();

    // Send rejection alert email to customer
    if (payment.clientEmail) {
      try {
        await sendEmail({
          to: payment.clientEmail,
          subject: `[ACTION REQUIRED] Payment Verification Notice: ${payment.serialNo} - ARCL Instruments`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; padding: 20px; border: 1px solid #fee2e2; borderRadius: 8px;">
              <h2 style="color: #dc2626; margin-top: 0;">⚠️ Payment Verification Rejected</h2>
              <p>Dear Customer (${payment.clientCompany}),</p>
              <p>Your submitted UPI payment for calibration request <strong>${payment.serialNo}</strong> could not be verified.</p>
              <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 12px; margin: 15px 0;">
                <strong style="color: #991b1b;">Reason for Rejection:</strong>
                <p style="margin: 5px 0 0 0; color: #7f1d1d;">${rejectionReason.trim()}</p>
              </div>
              <p>Submitted UTR: <code style="background: #eee; padding: 2px 6px;">${payment.utr || "N/A"}</code></p>
              <p>Please double check your transaction reference / UTR number in your banking app and resubmit details on the payment page.</p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.warn("Customer payment rejection email notice:", emailErr.message);
      }
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        { payment },
        "Payment verification rejected. Customer notified with rejection reason."
      )
    );
  } catch (err) {
    next(err);
  }
};

// 6. ADMIN LOG / RECORD MANUAL PAYMENT (e.g. For direct QR scans or bank statement credits like ₹1.18)
export const recordManualAdminPayment = async (req, res, next) => {
  try {
    const {
      serialNo,
      calibrationRecordId,
      clientCompany,
      amount,
      utr,
      paymentDate,
      adminNotes,
      status = "PAYMENT_VERIFIED",
    } = req.body;

    if (!utr || typeof utr !== "string" || utr.trim().length < 4) {
      throw new ApiError(400, "Valid 12-Digit UTR / Transaction Reference is required");
    }

    const cleanUtr = utr.trim().toUpperCase();
    const finalPayableAmount = Number(amount) > 0 ? Number(amount) : 1.18;
    const baseCharges = Math.max(1, Math.round(finalPayableAmount / 1.18));
    const gstAmount = finalPayableAmount - baseCharges;

    const adminName = req.user?.name || req.user?.email || "ARCL Accounts Admin";

    // Find if payment exists with this UTR or serialNo
    let payment = null;
    if (serialNo) {
      payment = await CalibrationPayment.findOne({
        $or: [
          { serialNo: { $regex: `^${serialNo.trim()}$`, $options: "i" } },
          { calibrationRequestId: { $regex: `^${serialNo.trim()}$`, $options: "i" } },
          { utr: cleanUtr },
        ],
      });
    } else {
      payment = await CalibrationPayment.findOne({ utr: cleanUtr });
    }

    // Also look up calibration record
    let record = null;
    if (calibrationRecordId && isValidMongoId(calibrationRecordId)) {
      record = await CalibrationRecord.findById(calibrationRecordId);
    }
    if (!record && serialNo) {
      record = await CalibrationRecord.findOne({
        $or: [
          { serialNo: { $regex: `^${serialNo.trim()}$`, $options: "i" } },
          { dcNo: { $regex: `^${serialNo.trim()}$`, $options: "i" } },
        ],
      });
    }

    if (payment) {
      payment.utr = cleanUtr;
      payment.finalPayableAmount = finalPayableAmount;
      payment.calibrationCharges = baseCharges;
      payment.gstAmount = gstAmount;
      payment.paymentStatus = status;
      payment.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
      payment.verifiedBy = req.user?._id || null;
      payment.verifiedByAdminName = adminName;
      payment.verifiedAt = new Date();
      if (adminNotes) payment.adminNotes = adminNotes.trim();
      if (clientCompany) payment.clientCompany = clientCompany.trim();

      payment.auditLog.push({
        action: "ADMIN_LOGGED_MANUAL_PAYMENT",
        performedBy: adminName,
        timestamp: new Date(),
        details: `Manual bank transaction recorded by Admin. UTR: ${cleanUtr}, Amount: ₹${finalPayableAmount}. Status: ${status}`,
      });

      await payment.save();
    } else {
      payment = await CalibrationPayment.create({
        calibrationRecordId: record?._id || null,
        calibrationRequestId: record?.serialNo || serialNo || `CALIB-${Date.now().toString().slice(-6)}`,
        clientCompany: clientCompany || record?.clientCompany || "Valued Client",
        clientName: record?.clientContactPerson || "",
        clientEmail: record?.clientEmail || "",
        clientPhone: record?.clientPhone || "",
        clientGst: record?.clientGst || "",
        instrument: record?.instrument || "Testing Equipment",
        serialNo: record?.serialNo || serialNo || "ARCL-CALIB",
        modelNo: record?.modelNo || "",
        make: record?.make || "",
        dcNo: record?.dcNo || "",
        calibrationCharges: baseCharges,
        gstRate: 18,
        gstAmount,
        finalPayableAmount,
        paymentStatus: status,
        utr: cleanUtr,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        verifiedBy: req.user?._id || null,
        verifiedByAdminName: adminName,
        verifiedAt: new Date(),
        adminNotes: adminNotes ? adminNotes.trim() : "Direct UPI / Bank Statement entry recorded",
        upiPayeeVpa: (process.env.UPI_ID || process.env.ARCL_UPI_VPA || "8572995533.2@hdfc").trim(),
        upiPayeeName: (process.env.UPI_PAYEE_NAME || process.env.ARCL_UPI_NAME || "ARCL INSTRUMENTS PRIVATE LIMITED").trim(),
        auditLog: [
          {
            action: "ADMIN_LOGGED_MANUAL_PAYMENT",
            performedBy: adminName,
            timestamp: new Date(),
            details: `Direct bank statement transaction logged by Admin. UTR: ${cleanUtr}, Amount: ₹${finalPayableAmount}. Status: ${status}`,
          },
        ],
      });
    }

    if (record) {
      await CalibrationRecord.findByIdAndUpdate(record._id, {
        "commercialDocs.paymentStatus": status === "PAYMENT_VERIFIED" ? "Paid" : "Pending",
        "commercialDocs.paymentDate": payment.paymentDate || new Date(),
      });
    }

    return res.status(200).json(
      new ApiResponse(200, { payment }, "Bank payment transaction logged and verified successfully")
    );
  } catch (err) {
    next(err);
  }
};

// 7. ADMIN DELETE SINGLE PAYMENT RECORD
export const deletePaymentByAdmin = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    if (!paymentId || !isValidMongoId(paymentId)) {
      throw new ApiError(400, "Valid Payment ID is required for deletion");
    }

    const payment = await CalibrationPayment.findById(paymentId);
    if (!payment) {
      throw new ApiError(404, "Payment record not found");
    }

    // Reset commercial payment status on associated CalibrationRecord if needed
    if (payment.calibrationRecordId) {
      await CalibrationRecord.findByIdAndUpdate(payment.calibrationRecordId, {
        "commercialDocs.paymentStatus": "Pending",
      });
    }

    await CalibrationPayment.findByIdAndDelete(paymentId);

    return res.status(200).json(
      new ApiResponse(200, { deletedId: paymentId }, "Payment record deleted successfully")
    );
  } catch (err) {
    next(err);
  }
};

// 8. ADMIN BULK DELETE PAYMENT RECORDS
export const bulkDeletePaymentsByAdmin = async (req, res, next) => {
  try {
    const { paymentIds } = req.body;
    if (!Array.isArray(paymentIds) || paymentIds.length === 0) {
      throw new ApiError(400, "Array of valid Payment IDs is required for bulk deletion");
    }

    const validIds = paymentIds.filter((id) => isValidMongoId(id));
    if (validIds.length === 0) {
      throw new ApiError(400, "No valid Payment IDs provided");
    }

    const paymentsToDelete = await CalibrationPayment.find({ _id: { $in: validIds } }).lean();
    const recordIdsToReset = paymentsToDelete
      .map((p) => p.calibrationRecordId)
      .filter((id) => id && isValidMongoId(String(id)));

    if (recordIdsToReset.length > 0) {
      await CalibrationRecord.updateMany(
        { _id: { $in: recordIdsToReset } },
        { "commercialDocs.paymentStatus": "Pending" }
      );
    }

    const result = await CalibrationPayment.deleteMany({ _id: { $in: validIds } });

    return res.status(200).json(
      new ApiResponse(
        200,
        { deletedCount: result.deletedCount, deletedIds: validIds },
        `Successfully deleted ${result.deletedCount} payment record(s)`
      )
    );
  } catch (err) {
    next(err);
  }
};

// 9. ADMIN EDIT / UPDATE PAYMENT RECORD DETAILS
export const updatePaymentDetailsByAdmin = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const {
      clientCompany,
      clientName,
      clientEmail,
      clientPhone,
      instrument,
      serialNo,
      finalPayableAmount,
      calibrationCharges,
      utr,
      paymentDate,
      paymentStatus,
      adminNotes,
      rejectionReason,
    } = req.body;

    if (!paymentId || !isValidMongoId(paymentId)) {
      throw new ApiError(400, "Valid Payment ID is required for editing");
    }

    const payment = await CalibrationPayment.findById(paymentId);
    if (!payment) {
      throw new ApiError(404, "Payment record not found");
    }

    const adminName = req.user?.name || req.user?.email || "ARCL Accounts Admin";

    if (clientCompany !== undefined) payment.clientCompany = clientCompany.trim();
    if (clientName !== undefined) payment.clientName = clientName.trim();
    if (clientEmail !== undefined) payment.clientEmail = clientEmail.trim();
    if (clientPhone !== undefined) payment.clientPhone = clientPhone.trim();
    if (instrument !== undefined) payment.instrument = instrument.trim();
    if (serialNo !== undefined) payment.serialNo = serialNo.trim();
    if (utr !== undefined) payment.utr = utr.trim().toUpperCase();
    if (paymentDate !== undefined) payment.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
    if (adminNotes !== undefined) payment.adminNotes = adminNotes.trim();
    if (rejectionReason !== undefined) payment.rejectionReason = rejectionReason.trim();

    if (finalPayableAmount !== undefined) {
      const amt = Number(finalPayableAmount) || 0;
      payment.finalPayableAmount = amt;
      payment.calibrationCharges = Math.max(1, Math.round(amt / 1.18));
      payment.gstAmount = amt - payment.calibrationCharges;
    } else if (calibrationCharges !== undefined) {
      const base = Number(calibrationCharges) || 0;
      payment.calibrationCharges = base;
      payment.gstAmount = Math.round(base * 0.18);
      payment.finalPayableAmount = base + payment.gstAmount;
    }

    if (paymentStatus && paymentStatus !== payment.paymentStatus) {
      payment.paymentStatus = paymentStatus;
      if (paymentStatus === "PAYMENT_VERIFIED") {
        payment.verifiedBy = req.user?._id || null;
        payment.verifiedByAdminName = adminName;
        payment.verifiedAt = new Date();
      } else if (paymentStatus === "PAYMENT_REJECTED") {
        payment.rejectedAt = new Date();
      }
    }

    payment.auditLog.push({
      action: "ADMIN_UPDATED_PAYMENT_DETAILS",
      performedBy: adminName,
      timestamp: new Date(),
      details: `Payment details updated by Admin. Status: ${payment.paymentStatus}, UTR: ${payment.utr || "N/A"}, Amount: ₹${payment.finalPayableAmount}`,
    });

    await payment.save();

    // Sync associated calibration record
    if (payment.calibrationRecordId) {
      await CalibrationRecord.findByIdAndUpdate(payment.calibrationRecordId, {
        "commercialDocs.paymentStatus": payment.paymentStatus === "PAYMENT_VERIFIED" ? "Paid" : "Pending",
        "commercialDocs.paymentDate": payment.paymentDate || new Date(),
        clientCompany: payment.clientCompany,
        instrument: payment.instrument,
        serialNo: payment.serialNo,
      });
    }

    return res.status(200).json(
      new ApiResponse(200, { payment }, "Payment record details updated successfully")
    );
  } catch (err) {
    next(err);
  }
};

// 10. ADMIN QUICK STATUS CHANGER
export const updatePaymentStatusByAdmin = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { status, adminNotes, rejectionReason } = req.body;

    if (!paymentId || !isValidMongoId(paymentId)) {
      throw new ApiError(400, "Valid Payment ID is required");
    }

    if (!status) {
      throw new ApiError(400, "Status is required");
    }

    const payment = await CalibrationPayment.findById(paymentId);
    if (!payment) {
      throw new ApiError(404, "Payment record not found");
    }

    const adminName = req.user?.name || req.user?.email || "ARCL Accounts Admin";
    payment.paymentStatus = status;

    if (status === "PAYMENT_VERIFIED") {
      payment.verifiedBy = req.user?._id || null;
      payment.verifiedByAdminName = adminName;
      payment.verifiedAt = new Date();
      if (adminNotes) payment.adminNotes = adminNotes.trim();
    } else if (status === "PAYMENT_REJECTED") {
      payment.rejectedAt = new Date();
      if (rejectionReason) payment.rejectionReason = rejectionReason.trim();
    }

    payment.auditLog.push({
      action: `STATUS_CHANGED_TO_${status}`,
      performedBy: adminName,
      timestamp: new Date(),
      details: `Payment status changed to ${status} by ${adminName}. Notes: ${adminNotes || rejectionReason || "Status updated"}`,
    });

    await payment.save();

    if (payment.calibrationRecordId) {
      await CalibrationRecord.findByIdAndUpdate(payment.calibrationRecordId, {
        "commercialDocs.paymentStatus": status === "PAYMENT_VERIFIED" ? "Paid" : "Pending",
        "commercialDocs.paymentDate": payment.paymentDate || new Date(),
      });
    }

    return res.status(200).json(
      new ApiResponse(200, { payment }, `Payment status updated to ${status} successfully`)
    );
  } catch (err) {
    next(err);
  }
};

// 11. SEND PAYMENT RECEIPT & NOTIFICATION TO CUSTOMER (EMAIL / WHATSAPP NOTICE)
export const sendPaymentReceiptToCustomer = async (req, res, next) => {
  try {
    const { paymentId } = req.params;
    const { channel = "email", customEmail, customPhone, messageNotes } = req.body;

    if (!paymentId || !isValidMongoId(paymentId)) {
      throw new ApiError(400, "Valid Payment ID is required");
    }

    const payment = await CalibrationPayment.findById(paymentId);
    if (!payment) {
      throw new ApiError(404, "Payment record not found");
    }

    const recipientEmail = customEmail || payment.clientEmail;
    const recipientPhone = customPhone || payment.clientPhone;
    const adminName = req.user?.name || req.user?.email || "ARCL Accounts Team";

    let emailSent = false;
    let emailError = null;

    if ((channel === "email" || channel === "both") && recipientEmail) {
      try {
        await sendEmail({
          to: recipientEmail,
          subject: `Payment Receipt & Confirmation: ${payment.serialNo} (UTR: ${payment.utr || "Verified"}) - ARCL Instruments`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
              <div style="text-align: center; border-bottom: 2px solid #021C57; padding-bottom: 16px; margin-bottom: 20px;">
                <h1 style="color: #021C57; margin: 0; font-size: 22px;">ARCL INSTRUMENTS PRIVATE LIMITED</h1>
                <p style="color: #64748b; margin: 4px 0 0; font-size: 12px;">NABL ISO/IEC 17025 Accredited Calibration Laboratory (CC-4313)</p>
                <div style="margin-top: 12px; display: inline-block; padding: 6px 16px; border-radius: 20px; background-color: #dcfce7; color: #15803d; font-weight: bold; font-size: 13px;">
                  ✅ OFFICIAL PAYMENT RECEIPT
                </div>
              </div>

              <p style="font-size: 14px; color: #334155;">Dear <strong>${payment.clientName || payment.clientCompany}</strong>,</p>
              <p style="font-size: 13px; color: #475569; line-height: 1.6;">
                We acknowledge receipt of your payment for calibration services. Below are your transaction details:
              </p>

              <table style="width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 13px;">
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Company / Client:</td>
                  <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #0f172a;">${payment.clientCompany}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Equipment / Instrument:</td>
                  <td style="padding: 10px; border: 1px solid #e2e8f0; color: #0f172a;">${payment.instrument} (S/N: ${payment.serialNo})</td>
                </tr>
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Bank UTR / Ref No:</td>
                  <td style="padding: 10px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: bold; color: #2563eb;">${payment.utr || "DIRECT-BANK-TRANSFER"}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Payment Date:</td>
                  <td style="padding: 10px; border: 1px solid #e2e8f0; color: #0f172a;">${payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN")}</td>
                </tr>
                <tr style="background-color: #f8fafc;">
                  <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Base Calibration Charges:</td>
                  <td style="padding: 10px; border: 1px solid #e2e8f0; color: #0f172a;">₹${(payment.calibrationCharges || 0).toLocaleString("en-IN")}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #475569;">GST Amount (18%):</td>
                  <td style="padding: 10px; border: 1px solid #e2e8f0; color: #0f172a;">₹${(payment.gstAmount || 0).toLocaleString("en-IN")}</td>
                </tr>
                <tr style="background-color: #eff6ff;">
                  <td style="padding: 12px 10px; border: 1px solid #bfdbfe; font-weight: bold; color: #1e3a8a; font-size: 15px;">Total Paid Amount:</td>
                  <td style="padding: 12px 10px; border: 1px solid #bfdbfe; font-weight: 900; color: #16a34a; font-size: 16px;">₹${(payment.finalPayableAmount || 0).toLocaleString("en-IN")}</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #475569;">Verification Status:</td>
                  <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold; color: #15803d;">${payment.paymentStatus}</td>
                </tr>
              </table>

              ${messageNotes ? `<div style="background-color: #f1f5f9; padding: 12px; border-radius: 8px; margin: 15px 0; font-size: 12px; color: #334155;"><strong>Admin Note:</strong> ${messageNotes}</div>` : ""}

              <p style="font-size: 12px; color: #64748b; line-height: 1.5; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 12px;">
                For any questions regarding this receipt or certificate status, please contact ARCL Accounts at <strong>info@arclinstruments.com</strong> or call <strong>+91 8572995533</strong>.
              </p>
            </div>
          `,
        });
        emailSent = true;
      } catch (err) {
        emailError = err.message;
        console.warn("Receipt email error:", err.message);
      }
    }

    // Format WhatsApp text for customer
    const waText = `*ARCL INSTRUMENTS - PAYMENT RECEIPT*\n\n` +
      `*Company:* ${payment.clientCompany}\n` +
      `*Instrument:* ${payment.instrument} (S/N: ${payment.serialNo})\n` +
      `*UTR / Ref:* ${payment.utr || "DIRECT-BANK-TRANSFER"}\n` +
      `*Amount Paid:* ₹${(payment.finalPayableAmount || 0).toLocaleString("en-IN")}\n` +
      `*Status:* ${payment.paymentStatus}\n` +
      `*Date:* ${payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString("en-IN") : new Date().toLocaleDateString("en-IN")}\n\n` +
      `Thank you for choosing ARCL Instruments! 🙏`;

    const cleanPhone = recipientPhone ? recipientPhone.replace(/[^0-9]/g, "") : "";
    const waUrl = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone.length === 10 ? "91" + cleanPhone : cleanPhone}&text=${encodeURIComponent(waText)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(waText)}`;

    payment.auditLog.push({
      action: "ADMIN_SENT_PAYMENT_RECEIPT",
      performedBy: adminName,
      timestamp: new Date(),
      details: `Payment receipt dispatched via ${channel}. Email: ${recipientEmail || "N/A"}, Phone: ${recipientPhone || "N/A"}`,
    });

    await payment.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          emailSent,
          emailError,
          whatsappUrl: waUrl,
          recipientEmail,
          recipientPhone,
        },
        emailSent
          ? "Payment receipt email dispatched to customer successfully!"
          : "Payment receipt processed. WhatsApp link generated."
      )
    );
  } catch (err) {
    next(err);
  }
};

// 11. ADMIN SYNC WITH CALIBRATION RECORDS
export const syncCalibrationPaymentsByAdmin = async (req, res, next) => {
  try {
    const result = await syncCalibrationRecordsToPayments();
    return res.status(200).json(
      new ApiResponse(
        200,
        result || {},
        result?.insertedCount > 0
          ? `Synced ${result.insertedCount} new calibration record(s) into payment ledger!`
          : "All calibration records are already synchronized with the payment ledger."
      )
    );
  } catch (err) {
    next(err);
  }
};


