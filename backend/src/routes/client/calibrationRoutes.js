import express from "express";
import {
  trackInstrument,
  verifyCalibrationCertificate,
  getCalibrationStats,
  downloadDocument,
  getNablLabScope,
  uploadPoDocument,
  deletePoDocument,
  getCustomEquipments,
  saveCustomEquipment,
} from "../../controllers/calibrationController.js";
import {
  getObservationTemplates,
  createObservationTemplate,
  updateObservationTemplate,
  deleteObservationTemplate,
  parsePdfPreview,
  streamTemplatePdf,
  convertCloudinaryPdfToForm,
  syncTemplatesFromDirectory,
} from "../../controllers/observationTemplateController.js";
import upload from "../../middlewares/multer.js";

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


router.get("/track", trackInstrument);
router.get("/verify-certificate", verifyCalibrationCertificate);
router.get("/stats", getCalibrationStats);
router.get("/lab-scope", getNablLabScope);
router.get("/custom-equipments", getCustomEquipments);
router.post("/custom-equipments", saveCustomEquipment);
router.get("/observation-templates", getObservationTemplates);
router.post("/observation-templates", templateUploadMiddleware, createObservationTemplate);
router.put("/observation-templates/:id", templateUploadMiddleware, updateObservationTemplate);
router.delete("/observation-templates/:id", deleteObservationTemplate);
router.post("/observation-templates/parse-preview", templateUploadMiddleware, parsePdfPreview);
router.get("/observation-templates/:id/pdf", streamTemplatePdf);
router.post("/observation-templates/convert-to-form", convertCloudinaryPdfToForm);
router.post("/observation-templates/:id/convert-to-form", convertCloudinaryPdfToForm);
router.post("/observation-templates/sync-from-directory", syncTemplatesFromDirectory);
router.get("/observation-templates/sync-from-directory", syncTemplatesFromDirectory);
router.get("/download-document", downloadDocument);
router.get("/document", downloadDocument);
router.post("/upload-po", upload.single("poFile"), uploadPoDocument);
router.post("/delete-po", deletePoDocument);

export default router;
