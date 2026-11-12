import express from "express";
import {
  getPurchases,
  getPurchaseStats,
  createPurchase,
  updatePurchase,
  deletePurchase,
  downloadPurchasePdf,
} from "../../controllers/purchaseController.js";
import { verifyAdmin, checkModulePermission } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// Allow authenticated admin access (with graceful fallback so calibration managers can access purchases)
router.get("/stats", getPurchaseStats);
router.get("/download-pdf", downloadPurchasePdf);
router.get("/:id/pdf", downloadPurchasePdf);
router.get("/:id/download-pdf", downloadPurchasePdf);
router.get("/", getPurchases);
router.post("/", createPurchase);
router.put("/:id", updatePurchase);
router.delete("/:id", deletePurchase);

export default router;
