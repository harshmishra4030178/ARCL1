import express from "express";
import {
  getPublishedBlogs,
  getBlogBySlug,
  getBlogCategoriesSummary,
} from "../../controllers/client/blogController.js";

const router = express.Router();

router.get("/", getPublishedBlogs);
router.get("/categories", getBlogCategoriesSummary);
router.get("/:slug", getBlogBySlug);

export default router;
