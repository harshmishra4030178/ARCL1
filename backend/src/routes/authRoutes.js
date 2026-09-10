import express from "express";
import {
  googleLogin,
  loginWithPassword,
  getMe,
  heartbeat,
  setPresenceOffline,
  getActiveAdmins,
} from "../controllers/authControllers.js";
import { verifyAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/google", googleLogin);
router.post("/login", loginWithPassword);
router.get("/me", verifyAdmin, getMe);
router.post("/heartbeat", verifyAdmin, heartbeat);
router.post("/offline", verifyAdmin, setPresenceOffline);
router.get("/active-admins", verifyAdmin, getActiveAdmins);

export default router;
