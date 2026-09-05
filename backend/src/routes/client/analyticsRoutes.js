import express from "express";
import { trackVisitor } from "../../controllers/client/analyticsControllers.js";

const router = express.Router();

router.post("/track", trackVisitor);

export default router;
