import express from "express";
import {
  punchInBiometric,
  punchOutBiometric,
  getMyTodayAttendance,
  getMyAttendanceHistory,
  getAllStaffTodayAttendance,
  getMonthlyAttendanceSheet,
  markManualAttendanceAdmin,
  getBiometricRegistrationChallenge,
  registerBiometricCredential,
} from "../../controllers/admin/attendanceController.js";
import { verifyAdmin, verifyUserManageAccess } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// All attendance routes require authenticated staff / admin
router.use(verifyAdmin);

// Staff Daily Punch In & Punch Out
router.post("/punch-in", punchInBiometric);
router.post("/punch-out", punchOutBiometric);
router.get("/today", getMyTodayAttendance);
router.get("/my-history", getMyAttendanceHistory);

// Biometric Enrollment (WebAuthn / Passkeys)
router.get("/biometric/challenge", getBiometricRegistrationChallenge);
router.post("/biometric/register", registerBiometricCredential);

// Admin Management & Reports (Roster & Monthly Matrix)
router.get("/staff-today", getAllStaffTodayAttendance);
router.get("/monthly-sheet", getMonthlyAttendanceSheet);
router.post("/manual-override", verifyUserManageAccess, markManualAttendanceAdmin);

export default router;
