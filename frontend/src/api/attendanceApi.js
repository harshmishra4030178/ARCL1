import API from "./axios";

/**
 * Punch In with Mobile Fingerprint / Biometric
 */
export const punchInBiometricApi = (data) =>
  API.post("/admin/attendance/punch-in", data);

/**
 * Punch Out with Mobile Fingerprint / Biometric
 */
export const punchOutBiometricApi = (data) =>
  API.post("/admin/attendance/punch-out", data);

/**
 * Get logged-in user's today attendance status
 */
export const getMyTodayAttendanceApi = () =>
  API.get("/admin/attendance/today");

/**
 * Get logged-in user's monthly attendance history
 */
export const getMyAttendanceHistoryApi = (month, year) =>
  API.get("/admin/attendance/my-history", { params: { month, year } });

/**
 * Admin: Get live staff roster for today
 */
export const getAllStaffTodayAttendanceApi = (date) =>
  API.get("/admin/attendance/staff-today", { params: { date } });

/**
 * Admin: Get monthly attendance matrix & report
 */
export const getMonthlyAttendanceSheetApi = (month, year) =>
  API.get("/admin/attendance/monthly-sheet", { params: { month, year } });

/**
 * Super Admin: Manual override / attendance adjustment
 */
export const markManualAttendanceAdminApi = (data) =>
  API.post("/admin/attendance/manual-override", data);

/**
 * WebAuthn Biometric registration challenge
 */
export const getBiometricChallengeApi = () =>
  API.get("/admin/attendance/biometric/challenge");

/**
 * WebAuthn Biometric save enrolled credential
 */
export const registerBiometricCredentialApi = (data) =>
  API.post("/admin/attendance/biometric/register", data);
