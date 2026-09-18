import express from "express";
import {
  trackInstrument,
  getCalibrationStats,
  downloadDocument,
  getNablLabScope,
  uploadPoDocument,
  deletePoDocument,
} from "../../controllers/calibrationController.js";
import upload from "../../middlewares/multer.js";

const router = express.Router();

router.get("/track", trackInstrument);
router.get("/stats", getCalibrationStats);
router.get("/lab-scope", getNablLabScope);
router.get("/download-document", downloadDocument);
router.get("/document", downloadDocument);
router.post("/upload-po", upload.single("poFile"), uploadPoDocument);
router.post("/delete-po", deletePoDocument);

export default router;
