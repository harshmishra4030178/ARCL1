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
} from "../../controllers/admin/productControllers.js";

const router = express.Router();

router.post("/", upload.single("image"), createProduct);
router.get("/", getProducts);
router.get("/id/:id", getProductById);
router.get("/category/:slug", getProductsByCategory);
router.get("/:slug", getProduct);
router.put("/:id", upload.single("image"), updateProduct);
router.patch("/:id/toggle-active", toggleProductActive);
router.patch("/:id/toggle-featured", toggleProductFeatured);
router.delete("/:id", deleteProduct);

export default router;