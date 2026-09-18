import express from "express";
import {
  trackInstrument,
  getCalibrationStats,
  downloadDocument,
  getNablLabScope,
} from "../../controllers/calibrationController.js";

const router = express.Router();

router.get("/track", trackInstrument);
router.get("/stats", getCalibrationStats);
router.get("/lab-scope", getNablLabScope);
router.get("/download-document", downloadDocument);
router.get("/document", downloadDocument);

export default router;
