import express from "express";
import {
  getAllSubscribers,
  deleteSubscriber,
} from "../../controllers/subscriberControllers.js";

const router = express.Router();

router.get("/", getAllSubscribers);
router.delete("/:id", deleteSubscriber);

export default router;
