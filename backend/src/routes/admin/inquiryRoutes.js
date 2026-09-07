import express from "express";
import { checkModulePermission } from "../../middlewares/authMiddleware.js";
import {
  deleteInquiry,
  getAllInquiries,
  getSingleInquiry,
  updateInquiryStatus,
} from "../../controllers/admin/inquiryControllers.js";

const router = express.Router();

router.get("/", checkModulePermission("inquiries", "view"), getAllInquiries);
router.get("/:id", checkModulePermission("inquiries", "view"), getSingleInquiry);
router.put("/:id", checkModulePermission("inquiries", "view"), updateInquiryStatus);
router.delete("/:id", checkModulePermission("inquiries", "delete"), deleteInquiry);

export default router;