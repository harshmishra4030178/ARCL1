import express from "express";
import {
  createCategory,
  getCategories,
  getCategoryById,
  getCategory,
  updateCategory,
  toggleCategoryStatus,
  toggleCategoryFeatured,
  deleteCategory,
} from "../../controllers/admin/categoryControllers.js";

const router = express.Router();

router.post("/", createCategory);
router.get("/", getCategories);
router.get("/id/:id", getCategoryById);
router.get("/:slug", getCategory);
router.put("/:id", updateCategory);
router.patch("/:id/toggle", toggleCategoryStatus);
router.patch("/:id/toggle-featured", toggleCategoryFeatured);
router.delete("/:id", deleteCategory);

export default router;