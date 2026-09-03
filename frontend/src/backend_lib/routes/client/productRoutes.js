import express from "express";
import {
  getProducts,
  getProduct,
  getProductsByCategory,
  getRelatedProducts,
  getFeaturedProducts,
  getHomeShowcase,
} from "../../controllers/client/productControllers.js";

const router = express.Router();

router.get("/", getProducts);
router.get("/home-showcase", getHomeShowcase);
router.get("/featured", getFeaturedProducts);
router.get("/category/:slug", getProductsByCategory);
router.get("/related/:id", getRelatedProducts);
router.get("/:slug", getProduct);

export default router;