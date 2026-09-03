import express from "express";
import {
  deleteInquiry,
  getAllInquiries,
  getSingleInquiry,
  updateInquiryStatus,
} from "../../controllers/admin/inquiryControllers.js";

const router = express.Router();

router.get("/", getAllInquiries);
router.get("/:id", getSingleInquiry);
router.put("/:id", updateInquiryStatus);
router.delete("/:id", deleteInquiry);

export default router;