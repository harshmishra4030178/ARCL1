import express from "express";
import {
  googleLogin,
  loginWithPassword,
  getMe,
} from "../controllers/authControllers.js";
import { verifyAdmin } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/google", googleLogin);
router.post("/login", loginWithPassword);
router.get("/me", verifyAdmin, getMe);

export default router;
