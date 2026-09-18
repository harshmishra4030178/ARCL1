import express from "express";
import {
  getCalibrationRecords,
  getCalibrationStats,
  createCalibrationRecord,
  updateCalibrationRecord,
  updateCalibrationBatch,
  deleteCalibrationRecord,
  sendDueReminder,
  autoDispatchAllDueReminders,
  sendCertificateDeliveryNotification,
  sendSpecificDocumentNotification,
  getAutoReminderStatusHandler,
  triggerAutoReminderScanHandler,
  toggleAutoReminderHandler,
  getQuotationData,
  saveQuotationData,
  getTaxInvoiceData,
  saveTaxInvoiceData,
  getProformaData,
  saveProformaData,
  clearAllCalibrationData,
  getNablLabScope,
  updateNablLabScope,
  addNablScopeItem,
  updateNablScopeItem,
  deleteNablScopeItem,
  resetNablLabScope,
  uploadPoDocument,
  deletePoDocument,
} from "../../controllers/calibrationController.js";
import upload from "../../middlewares/multer.js";
import { verifyAdmin, checkModulePermission } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// 1. Enforce authenticated Admin / Superadmin
router.use(verifyAdmin);

// 2. Granular Module & Action Level RBAC
router.get("/", checkModulePermission("calibration"), getCalibrationRecords);
router.get("/stats", checkModulePermission("calibration"), getCalibrationStats);
router.get("/lab-scope", checkModulePermission("calibration"), getNablLabScope);
router.put("/lab-scope", checkModulePermission("calibration", "edit"), updateNablLabScope);
router.post("/lab-scope/item", checkModulePermission("calibration", "create"), addNablScopeItem);
router.put("/lab-scope/item/:itemId", checkModulePermission("calibration", "edit"), updateNablScopeItem);
router.delete("/lab-scope/item/:itemId", checkModulePermission("calibration", "delete"), deleteNablScopeItem);
router.post("/lab-scope/reset", checkModulePermission("calibration", "edit"), resetNablLabScope);
router.get("/auto-reminder/status", checkModulePermission("calibration"), getAutoReminderStatusHandler);
router.post("/auto-reminder/trigger", checkModulePermission("calibration", "dispatch"), triggerAutoReminderScanHandler);
router.post("/auto-reminder/toggle", checkModulePermission("calibration", "dispatch"), toggleAutoReminderHandler);
router.get("/quotation", checkModulePermission("calibration"), getQuotationData);
router.post("/quotation/save", checkModulePermission("calibration", "documents"), saveQuotationData);
router.get("/tax-invoice", checkModulePermission("calibration"), getTaxInvoiceData);
router.post("/tax-invoice/save", checkModulePermission("calibration", "documents"), saveTaxInvoiceData);
router.get("/proforma", checkModulePermission("calibration"), getProformaData);
router.post("/proforma/save", checkModulePermission("calibration", "documents"), saveProformaData);
router.post("/upload-po", upload.single("poFile"), uploadPoDocument);
router.post("/delete-po", deletePoDocument);
router.put("/batch/update", checkModulePermission("calibration", "edit"), updateCalibrationBatch);
router.post("/batch/update", checkModulePermission("calibration", "edit"), updateCalibrationBatch);
router.post("/", checkModulePermission("calibration", "create"), createCalibrationRecord);
router.put("/:id", checkModulePermission("calibration", "edit"), updateCalibrationRecord);
router.delete("/:id", checkModulePermission("calibration", "delete"), deleteCalibrationRecord);
router.post("/clear-all", checkModulePermission("calibration", "delete"), clearAllCalibrationData);
router.post("/send-reminder", checkModulePermission("calibration", "dispatch"), sendDueReminder);
router.post("/auto-dispatch-all", checkModulePermission("calibration", "dispatch"), autoDispatchAllDueReminders);
router.post("/send-certificate-delivery", checkModulePermission("calibration", "dispatch"), sendCertificateDeliveryNotification);
router.post("/send-document", checkModulePermission("calibration", "dispatch"), sendSpecificDocumentNotification);

export default router;
