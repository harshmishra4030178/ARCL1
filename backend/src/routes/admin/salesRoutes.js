import express from "express";
import {
  getSalesQuotations,
  createSalesQuotation,
  updateSalesQuotation,
  deleteSalesQuotation,
  downloadSalesQuotationPdf,
  getSalesSrfs,
  createSalesSrf,
  downloadSalesSrfDocumentPdf,
  updateSalesSrf,
  updateSalesSrfPayment,
  advanceSalesSrfStage,
  deleteSalesSrf,
  uploadSalesPo,
  deleteSalesPo,
  convertQuotationToSrf,
  getSalesStats,
  createCustomQuotationProduct,
} from "../../controllers/admin/salesController.js";
import upload from "../../middlewares/multer.js";

const router = express.Router();

// Sales KPI Statistics
router.get("/stats", getSalesStats);

// Custom Product Creation (Quotation Scope, Cloudinary Upload & Internal Catalog)
router.post("/custom-product", upload.single("image"), createCustomQuotationProduct);

// Sales Quotations Routes
router.get("/quotations", getSalesQuotations);
router.post("/quotations", createSalesQuotation);
router.get("/quotations/:id/download-pdf", downloadSalesQuotationPdf);
router.put("/quotations/:id", updateSalesQuotation);
router.delete("/quotations/:id", deleteSalesQuotation);
router.post("/quotations/:id/convert-to-srf", convertQuotationToSrf);

// Sales SRF & Commercial Orders Routes
router.get("/srfs", getSalesSrfs);
router.post("/srfs", createSalesSrf);
router.get("/srfs/:id/download-pdf", downloadSalesSrfDocumentPdf);
router.put("/srfs/:id", updateSalesSrf);
router.put("/srfs/:id/payment", updateSalesSrfPayment);
router.put("/srfs/:id/advance-stage", advanceSalesSrfStage);
router.delete("/srfs/:id", deleteSalesSrf);

// PO Document Upload & Delete Routes
router.post("/upload-po", upload.single("poFile"), uploadSalesPo);
router.post("/delete-po", deleteSalesPo);

export default router;
