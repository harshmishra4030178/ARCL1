import express from "express";
import { checkModulePermission } from "../../middlewares/authMiddleware.js";
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

router.post("/", checkModulePermission("categories", "create"), createCategory);
router.get("/", getCategories);
router.get("/id/:id", getCategoryById);
router.get("/:slug", getCategory);
router.put("/:id", checkModulePermission("categories", "edit"), updateCategory);
router.patch("/:id/toggle", checkModulePermission("categories", "edit"), toggleCategoryStatus);
router.patch("/:id/toggle-featured", checkModulePermission("categories", "edit"), toggleCategoryFeatured);
router.delete("/:id", checkModulePermission("categories", "delete"), deleteCategory);

export default router;