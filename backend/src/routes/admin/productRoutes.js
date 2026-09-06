import express from "express";
import upload from "../../middlewares/multer.js";
import {
  createProduct,
  deleteProduct,
  getProduct,
  getProductById,
  getProducts,
  updateProduct,
  toggleProductActive,
  toggleProductFeatured,
  getProductsByCategory,
  generateSingleProductQrCode,
  generateAllMissingQrCodes,
} from "../../controllers/admin/productControllers.js";

const router = express.Router();

router.post("/", upload.single("image"), createProduct);
router.post("/generate-all-qr", generateAllMissingQrCodes);
router.post("/:id/generate-qr", generateSingleProductQrCode);
router.get("/", getProducts);
router.get("/id/:id", getProductById);
router.get("/category/:slug", getProductsByCategory);
router.get("/:slug", getProduct);
router.put("/:id", upload.single("image"), updateProduct);
router.patch("/:id/toggle-active", toggleProductActive);
router.patch("/:id/toggle-featured", toggleProductFeatured);
router.delete("/:id", deleteProduct);

export default router;