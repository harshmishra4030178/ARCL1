import express from "express";
import upload from "../../middlewares/multer.js";
import { checkModulePermission } from "../../middlewares/authMiddleware.js";
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

router.post("/", upload.single("image"), checkModulePermission("products", "create"), createProduct);
router.post("/generate-all-qr", checkModulePermission("products", "edit"), generateAllMissingQrCodes);
router.post("/:id/generate-qr", checkModulePermission("products", "edit"), generateSingleProductQrCode);
router.get("/", getProducts);
router.get("/id/:id", getProductById);
router.get("/category/:slug", getProductsByCategory);
router.get("/:slug", getProduct);
router.put("/:id", upload.single("image"), checkModulePermission("products", "edit"), updateProduct);
router.patch("/:id/toggle-active", checkModulePermission("products", "edit"), toggleProductActive);
router.patch("/:id/toggle-featured", checkModulePermission("products", "edit"), toggleProductFeatured);
router.delete("/:id", checkModulePermission("products", "delete"), deleteProduct);

export default router;