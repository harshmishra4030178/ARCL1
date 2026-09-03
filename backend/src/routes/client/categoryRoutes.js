import express from "express";
import {
  getCategories,
  getCategory,
  getCategoriesByEquipmentType,
  getFeaturedCategoriesWithProducts,
} from "../../controllers/client/categoryControllers.js";

const router = express.Router();

router.get("/", getCategories);
router.get("/featured-showcase", getFeaturedCategoriesWithProducts);
router.get("/equipment/:slug", getCategoriesByEquipmentType);
router.get("/:slug", getCategory);

export default router;