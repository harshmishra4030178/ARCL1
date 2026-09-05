import express from "express";
import upload from "../../middlewares/multer.js";
import {
  getAllSubscribers,
  deleteSubscriber,
  getSmsAudiences,
  sendBulkSmsBroadcast,
  getSmsCampaigns,
} from "../../controllers/subscriberControllers.js";

const router = express.Router();

router.get("/", getAllSubscribers);
router.get("/audiences", getSmsAudiences);
router.post("/send-bulk-sms", upload.single("image"), sendBulkSmsBroadcast);
router.post("/send-broadcast", upload.single("image"), sendBulkSmsBroadcast);
router.get("/campaigns", getSmsCampaigns);
router.delete("/:id", deleteSubscriber);

export default router;
