import express from "express";
import upload from "../../middlewares/multer.js";
import { checkModulePermission } from "../../middlewares/authMiddleware.js";
import {
  getAllSubscribers,
  deleteSubscriber,
  getSmsAudiences,
  sendBulkSmsBroadcast,
  getSmsCampaigns,
} from "../../controllers/subscriberControllers.js";

const router = express.Router();

router.get("/", checkModulePermission("subscribers", "view"), getAllSubscribers);
router.get("/audiences", checkModulePermission("subscribers", "view"), getSmsAudiences);
router.post("/send-bulk-sms", upload.single("image"), checkModulePermission("subscribers", "create"), sendBulkSmsBroadcast);
router.post("/send-broadcast", upload.single("image"), checkModulePermission("subscribers", "create"), sendBulkSmsBroadcast);
router.get("/campaigns", checkModulePermission("subscribers", "view"), getSmsCampaigns);
router.delete("/:id", checkModulePermission("subscribers", "delete"), deleteSubscriber);

export default router;
