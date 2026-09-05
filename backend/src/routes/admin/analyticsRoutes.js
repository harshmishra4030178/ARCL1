import express from "express";
import { getVisitorAnalytics } from "../../controllers/admin/analyticsControllers.js";

const router = express.Router();

router.get("/visitors", getVisitorAnalytics);

export default router;
