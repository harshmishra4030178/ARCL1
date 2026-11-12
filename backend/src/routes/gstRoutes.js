import express from "express";
import { fetchGstDetails, validateGstinFormat, saveGstRecord } from "../services/gstService.js";
import ApiResponse from "../utils/ApiResponse.js";

const router = express.Router();

// POST /api/v1/client/gst/verify or /api/gst/verify
router.post("/verify", async (req, res, next) => {
  try {
    const { gstin } = req.body || {};
    const result = await fetchGstDetails(gstin);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/client/gst/fetch/:gstin
router.get("/fetch/:gstin", async (req, res, next) => {
  try {
    const { gstin } = req.params;
    const result = await fetchGstDetails(gstin);
    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/client/gst/validate/:gstin
router.get("/validate/:gstin", (req, res) => {
  const validation = validateGstinFormat(req.params.gstin);
  return res.json(validation);
});

// POST /api/v1/client/gst/save
router.post("/save", async (req, res, next) => {
  try {
    const saved = await saveGstRecord(req.body || {});
    return res.status(200).json(new ApiResponse(200, saved, "GST Directory record saved"));
  } catch (err) {
    next(err);
  }
});

export default router;
