import express from "express";
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
router.post("/", createBlog);
router.put("/:id", updateBlog);
router.delete("/:id", deleteBlog);
router.patch("/:id/toggle-publish", togglePublishStatus);

export default router;
