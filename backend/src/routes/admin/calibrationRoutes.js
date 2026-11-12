import express from "express";
import {
  getCalibrationRecords,
  getCalibrationStats,
  createCalibrationRecord,
  updateCalibrationRecord,
  updateCalibrationBatch,
  updateCalibrationBatchPayment,
  updateCalibrationQuotationStatus,
  releaseCalibrationEquipments,
  markCalibrationSrfDone,
  updateInwardRegisterRow,
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
  getCustomEquipments,
  saveCustomEquipment,
  saveCalibrationObservation,
  parseAndAttachFilledObservation,
  listHardwareScanners,
  scanObservationFromHardwareScanner,
  authorizeCalibrationObservation,
} from "../../controllers/calibrationController.js";
import {
  getPurchases,
  getPurchaseStats,
  createPurchase,
  updatePurchase,
  deletePurchase,
} from "../../controllers/purchaseController.js";
import {
  getObservationTemplates,
  getObservationTemplateById,
  createObservationTemplate,
  updateObservationTemplate,
  deleteObservationTemplate,
  parsePdfPreview,
  streamTemplatePdf,
  convertCloudinaryPdfToForm,
} from "../../controllers/observationTemplateController.js";
import upload from "../../middlewares/multer.js";
import { verifyAdmin, checkModulePermission } from "../../middlewares/authMiddleware.js";

const router = express.Router();
const templateUploadMiddleware = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) return next(err);
    if (Array.isArray(req.files) && req.files.length > 0) {
      req.file =
        req.files.find(
          (f) => f.fieldname === "templatePdf" || f.fieldname === "pdf"
        ) || req.files[0];
    }
    next();
  });
};


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
router.post("/auto-reminder/trigger", checkModulePermission("calibration"), triggerAutoReminderScanHandler);
router.post("/auto-reminder/toggle", checkModulePermission("calibration"), toggleAutoReminderHandler);
router.get("/quotation", checkModulePermission("calibration"), getQuotationData);
router.post("/quotation/save", checkModulePermission("calibration"), saveQuotationData);
router.get("/tax-invoice", checkModulePermission("calibration"), getTaxInvoiceData);
router.post("/tax-invoice/save", checkModulePermission("calibration"), saveTaxInvoiceData);
router.get("/proforma", checkModulePermission("calibration"), getProformaData);
router.post("/proforma/save", checkModulePermission("calibration"), saveProformaData);
// Observation Format Templates Manager & Dynamic PDF to Form Endpoints
router.get("/observation-templates", getObservationTemplates);
router.get("/observation-templates/:id", getObservationTemplateById);
router.post("/observation-templates", templateUploadMiddleware, createObservationTemplate);
router.put("/observation-templates/:id", templateUploadMiddleware, updateObservationTemplate);
router.delete("/observation-templates/:id", deleteObservationTemplate);
router.post("/observation-templates/parse-preview", templateUploadMiddleware, parsePdfPreview);
router.get("/observation-templates/:id/pdf", streamTemplatePdf);
router.post("/observation-templates/convert-to-form", convertCloudinaryPdfToForm);
router.post("/observation-templates/:id/convert-to-form", convertCloudinaryPdfToForm);
router.post("/observation/save", checkModulePermission("calibration", "edit"), saveCalibrationObservation);
router.post("/observation/parse-filled", checkModulePermission("calibration", "edit"), templateUploadMiddleware, parseAndAttachFilledObservation);
router.get("/observation/scanners", checkModulePermission("calibration"), listHardwareScanners);
router.post("/observation/direct-scan", checkModulePermission("calibration", "edit"), scanObservationFromHardwareScanner);
router.post("/observation/authorize", checkModulePermission("calibration", "edit"), authorizeCalibrationObservation);
router.post("/upload-po", upload.single("poFile"), uploadPoDocument);
router.post("/delete-po", deletePoDocument);
router.put("/batch/payment", checkModulePermission("calibration", "edit"), updateCalibrationBatchPayment);
router.post("/batch/payment", checkModulePermission("calibration", "edit"), updateCalibrationBatchPayment);
router.put("/batch/quotation-status", checkModulePermission("calibration", "edit"), updateCalibrationQuotationStatus);
router.post("/batch/quotation-status", checkModulePermission("calibration", "edit"), updateCalibrationQuotationStatus);
router.put("/batch/release-equipments", checkModulePermission("calibration", "edit"), releaseCalibrationEquipments);
router.post("/batch/release-equipments", checkModulePermission("calibration", "edit"), releaseCalibrationEquipments);
router.put("/batch/srf-done", checkModulePermission("calibration", "edit"), markCalibrationSrfDone);
router.post("/batch/srf-done", checkModulePermission("calibration", "edit"), markCalibrationSrfDone);
router.put("/inward-register/:recordId", checkModulePermission("calibration", "edit"), updateInwardRegisterRow);
router.put("/batch/update", checkModulePermission("calibration", "edit"), updateCalibrationBatch);
router.post("/batch/update", checkModulePermission("calibration", "edit"), updateCalibrationBatch);
router.post("/", checkModulePermission("calibration", "create"), createCalibrationRecord);
router.put("/:id", checkModulePermission("calibration", "edit"), updateCalibrationRecord);
router.delete("/:id", checkModulePermission("calibration", "delete"), deleteCalibrationRecord);
router.post("/clear-all", checkModulePermission("calibration", "delete"), clearAllCalibrationData);
router.post("/send-reminder", checkModulePermission("calibration"), sendDueReminder);
router.post("/auto-dispatch-all", checkModulePermission("calibration"), autoDispatchAllDueReminders);
router.post("/send-certificate-delivery", checkModulePermission("calibration"), sendCertificateDeliveryNotification);
router.post("/send-document", checkModulePermission("calibration"), sendSpecificDocumentNotification);

// Commercial Purchases & Expense Tracker Endpoints
router.get("/custom-equipments", getCustomEquipments);
router.post("/custom-equipments", saveCustomEquipment);
router.get("/purchases/stats", getPurchaseStats);
router.get("/purchases", getPurchases);
router.post("/purchases", createPurchase);
router.put("/purchases/:id", updatePurchase);
router.delete("/purchases/:id", deletePurchase);

export default router;
