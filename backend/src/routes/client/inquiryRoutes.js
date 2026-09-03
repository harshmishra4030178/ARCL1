import express from "express";
import { createInquiry } from "../../controllers/client/inquiryControllers.js";

const router = express.Router();

router.post("/", createInquiry);

export default router;