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
  isHarshMishra,
} from "../../controllers/admin/attendanceController.js";
import { verifyAdmin } from "../../middlewares/authMiddleware.js";

const router = express.Router();

// Middleware: Strictly ONLY Harsh Mishra can access manual override. Even SuperAdmins cannot.
const verifyHarshMishraOnly = (req, res, next) => {
  const user = req.user || req.admin;
  if (!isHarshMishra(user)) {
    return res.status(403).json({
      success: false,
      message:
        "Forbidden: Sirf Harsh Mishra hi staff attendance manually edit ya adjust kar sakte hain. SuperAdmin ko bhi permission nahi hai.",
    });
  }
  next();
};

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

// Strictly ONLY Harsh Mishra can manually override or adjust attendance
router.post("/manual-override", verifyHarshMishraOnly, markManualAttendanceAdmin);

export default router;
