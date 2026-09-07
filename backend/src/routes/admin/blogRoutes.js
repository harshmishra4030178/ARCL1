import express from "express";
import { checkModulePermission } from "../../middlewares/authMiddleware.js";
import {
  getAllBlogsAdmin,
  getBlogByIdAdmin,
  createBlog,
  updateBlog,
  deleteBlog,
  togglePublishStatus,
} from "../../controllers/admin/blogController.js";

const router = express.Router();

router.get("/", getAllBlogsAdmin);
router.get("/:id", getBlogByIdAdmin);
router.post("/", checkModulePermission("blogs", "create"), createBlog);
router.put("/:id", checkModulePermission("blogs", "edit"), updateBlog);
router.delete("/:id", checkModulePermission("blogs", "delete"), deleteBlog);
router.patch("/:id/toggle-publish", checkModulePermission("blogs", "edit"), togglePublishStatus);

export default router;
