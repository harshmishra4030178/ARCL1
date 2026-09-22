import express from "express";
import {
  getPaymentDetailsForCustomer,
  submitCustomerPayment,
  getAdminPayments,
  verifyPaymentByAdmin,
  rejectPaymentByAdmin,
  recordManualAdminPayment,
  deletePaymentByAdmin,
  bulkDeletePaymentsByAdmin,
  updatePaymentDetailsByAdmin,
  updatePaymentStatusByAdmin,
  sendPaymentReceiptToCustomer,
  syncCalibrationPaymentsByAdmin,
} from "../controllers/calibrationPaymentController.js";
import upload from "../middlewares/multer.js";
import { verifyAdmin, checkModulePermission } from "../middlewares/authMiddleware.js";

const router = express.Router();

// ==========================================
// PUBLIC CUSTOMER PAYMENT ENDPOINTS
// ==========================================

// Get payment details, billing calculation, and dynamic UPI QR code
router.get("/details/:id", getPaymentDetailsForCustomer);
router.get("/customer/:id", getPaymentDetailsForCustomer);

// Submit UTR, Date, Notes & Screenshot for manual admin verification
router.post("/submit/:id", upload.single("paymentScreenshot"), submitCustomerPayment);
router.post("/customer/submit/:id", upload.single("paymentScreenshot"), submitCustomerPayment);

// ==========================================
// PROTECTED ADMIN VERIFICATION ENDPOINTS
// ==========================================

// Admin Sync Payment Ledger with Calibration Records
router.post(
  "/admin/sync",
  verifyAdmin,
  checkModulePermission("calibration", "edit"),
  syncCalibrationPaymentsByAdmin
);
router.post(
  "/sync",
  verifyAdmin,
  checkModulePermission("calibration", "edit"),
  syncCalibrationPaymentsByAdmin
);

// Admin Payment Verification Dashboard
router.get(
  "/admin/list",
  verifyAdmin,
  checkModulePermission("calibration"),
  getAdminPayments
);
router.get(
  "/list",
  verifyAdmin,
  checkModulePermission("calibration"),
  getAdminPayments
);

// Admin Verify Payment Action
router.post(
  "/admin/verify/:paymentId",
  verifyAdmin,
  checkModulePermission("calibration", "edit"),
  verifyPaymentByAdmin
);
router.post(
  "/verify/:paymentId",
  verifyAdmin,
  checkModulePermission("calibration", "edit"),
  verifyPaymentByAdmin
);

// Admin Reject Payment Action
router.post(
  "/admin/reject/:paymentId",
  verifyAdmin,
  checkModulePermission("calibration", "edit"),
  rejectPaymentByAdmin
);
router.post(
  "/reject/:paymentId",
  verifyAdmin,
  checkModulePermission("calibration", "edit"),
  rejectPaymentByAdmin
);

// Admin Manual Payment Record Action (e.g. ₹1.18 or direct bank transactions)
router.post(
  "/admin/manual-record",
  verifyAdmin,
  checkModulePermission("calibration", "edit"),
  recordManualAdminPayment
);
router.post(
  "/manual-record",
  verifyAdmin,
  checkModulePermission("calibration", "edit"),
  recordManualAdminPayment
);

// Admin Edit / Update Payment Details
router.put(
  "/admin/update/:paymentId",
  verifyAdmin,
  checkModulePermission("calibration", "edit"),
  updatePaymentDetailsByAdmin
);
router.put(
  "/:paymentId",
  verifyAdmin,
  checkModulePermission("calibration", "edit"),
  updatePaymentDetailsByAdmin
);

// Admin Quick Status Changer
router.patch(
  "/admin/status/:paymentId",
  verifyAdmin,
  checkModulePermission("calibration", "edit"),
  updatePaymentStatusByAdmin
);
router.patch(
  "/:paymentId/status",
  verifyAdmin,
  checkModulePermission("calibration", "edit"),
  updatePaymentStatusByAdmin
);

// Admin Send Payment Receipt (Email / WhatsApp)
router.post(
  "/admin/send-receipt/:paymentId",
  verifyAdmin,
  checkModulePermission("calibration", "edit"),
  sendPaymentReceiptToCustomer
);
router.post(
  "/:paymentId/send-receipt",
  verifyAdmin,
  checkModulePermission("calibration", "edit"),
  sendPaymentReceiptToCustomer
);

// Admin Bulk Delete Payments
router.post(
  "/admin/bulk-delete",
  verifyAdmin,
  checkModulePermission("calibration", "delete"),
  bulkDeletePaymentsByAdmin
);
router.post(
  "/bulk-delete",
  verifyAdmin,
  checkModulePermission("calibration", "delete"),
  bulkDeletePaymentsByAdmin
);

// Admin Delete Single Payment
router.delete(
  "/admin/:paymentId",
  verifyAdmin,
  checkModulePermission("calibration", "delete"),
  deletePaymentByAdmin
);
router.delete(
  "/:paymentId",
  verifyAdmin,
  checkModulePermission("calibration", "delete"),
  deletePaymentByAdmin
);

export default router;

