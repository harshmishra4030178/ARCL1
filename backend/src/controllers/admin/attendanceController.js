import Attendance from "../../models/Attendance.js";
import UserBiometricCredential from "../../models/UserBiometricCredential.js";
import User from "../../models/userModel.js";
import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import {
  getCleanClientIp,
  isIpInWhitelist,
  getHaversineDistanceMeters,
  getOrCreateOfficeSecurityConfig,
} from "../../utils/officeSecurityHelper.js";
import crypto from "node:crypto";

/**
 * Helper: Get current date in Indian Timezone YYYY-MM-DD
 */
export const getTodayDateStringIndia = () => {
  const d = new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return formatter.format(d);
};

/**
 * Helper: Format time in Indian 12-hour format e.g. "09:35 AM"
 */
export const formatTimeIndia = (dateObj = new Date()) => {
  return dateObj.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

/**
 * Validate Office Security Rules for Attendance (WiFi + GPS Geofence)
 * Only enforced if user is OFFICE_ONLY. Anywhere users can punch from anywhere.
 */
const validateAttendanceSecurity = async ({ user, req, latitude, longitude }) => {
  const rawScope = String(user?.accessScope || "").trim().toUpperCase();
  const isOfficeOnly = rawScope === "OFFICE_ONLY";

  const clientIp = getCleanClientIp(req);
  const config = await getOrCreateOfficeSecurityConfig();

  if (!isOfficeOnly) {
    return {
      passed: true,
      clientIp,
      isWifiVerified: true,
      isLocationVerified: true,
      distanceMeters: null,
    };
  }

  // User is OFFICE_ONLY -> Verify WiFi & GPS
  let isWifiVerified = true;
  let wifiError = "";
  if (config.isEnforceWifi) {
    const isWifiOk = isIpInWhitelist(clientIp, config.officeWifiIps);
    if (!isWifiOk) {
      isWifiVerified = false;
      wifiError = `Aapka Network IP (${clientIp}) Authorized Office WiFi Whitelist me nahi hai.`;
    }
  }

  let isLocationVerified = true;
  let locationError = "";
  let distanceMeters = null;

  if (config.isEnforceLocation) {
    const numLat = parseFloat(latitude);
    const numLon = parseFloat(longitude);

    if (
      latitude === null ||
      latitude === undefined ||
      longitude === null ||
      longitude === undefined ||
      isNaN(numLat) ||
      isNaN(numLon)
    ) {
      isLocationVerified = false;
      locationError = "Mobile GPS location prapt nahi hua. Kripya phone me Location allow karein.";
    } else {
      distanceMeters = getHaversineDistanceMeters(
        numLat,
        numLon,
        config.officeLatitude,
        config.officeLongitude
      );

      if (distanceMeters > config.officeRadiusMeters) {
        isLocationVerified = false;
        const roundedDist = Math.round(distanceMeters);
        locationError = `Aap office premises se ${roundedDist}m door hain (Allowed: ${config.officeRadiusMeters}m).`;
      }
    }
  }

  if (!isWifiVerified || !isLocationVerified) {
    const errMsg = [
      "Attendance Punch Asafal!",
      wifiError ? `• WiFi: ${wifiError}` : null,
      locationError ? `• Location: ${locationError}` : null,
      "Suraksha niyam: Punch lagane ke liye Company Office WiFi aur Office Premises ke andar hona anivarya hai.",
    ]
      .filter(Boolean)
      .join("\n");

    return {
      passed: false,
      clientIp,
      isWifiVerified,
      isLocationVerified,
      distanceMeters: distanceMeters ? Math.round(distanceMeters) : null,
      error: errMsg,
    };
  }

  return {
    passed: true,
    clientIp,
    isWifiVerified: true,
    isLocationVerified: true,
    distanceMeters: distanceMeters ? Math.round(distanceMeters) : null,
  };
};

/**
 * @desc    Punch In with Mobile Fingerprint / Biometric
 * @route   POST /api/v1/admin/attendance/punch-in
 * @access  Authenticated Staff / Admin
 */
export const punchInBiometric = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, "Authentication required to mark attendance.");
  }

  const { latitude, longitude, authMethod, deviceInfo, biometricVerified } =
    req.body;

  // Validate Office WiFi + GPS (for OFFICE_ONLY staff)
  const sec = await validateAttendanceSecurity({
    user,
    req,
    latitude,
    longitude,
  });

  if (!sec.passed) {
    return res.status(403).json(
      new ApiResponse(
        403,
        { isSecurityFailed: true, details: sec },
        sec.error || "Attendance verification failed."
      )
    );
  }

  const todayStr = getTodayDateStringIndia();
  const now = new Date();
  const timeFormatted = formatTimeIndia(now);

  // Check if already punched in today
  let record = await Attendance.findOne({ user: user._id, date: todayStr });

  if (record && record.punchIn && record.punchIn.time) {
    return res.status(400).json(
      new ApiResponse(
        400,
        { record },
        `Aap aaj pehle hi punch in kar chuke hain (${record.punchIn.formattedTime} baje).`
      )
    );
  }

  // Late check: e.g. after 09:45 AM Indian Time
  // Extract Indian hours and minutes
  const indiaHour = parseInt(
    new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      hour12: false,
    }).format(now),
    10
  );
  const indiaMinute = parseInt(
    new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      minute: "numeric",
    }).format(now),
    10
  );

  const isLate = indiaHour > 9 || (indiaHour === 9 && indiaMinute > 45);

  const punchInData = {
    time: now,
    formattedTime: timeFormatted,
    authMethod: authMethod || (biometricVerified ? "FINGERPRINT_BIOMETRIC" : "OFFICE_VERIFIED"),
    clientIp: sec.clientIp,
    deviceInfo: deviceInfo || req.headers["user-agent"] || "Mobile Device",
    latitude: latitude ? Number(latitude) : null,
    longitude: longitude ? Number(longitude) : null,
    isWifiVerified: sec.isWifiVerified,
    isLocationVerified: sec.isLocationVerified,
    distanceMeters: sec.distanceMeters,
  };

  if (!record) {
    record = await Attendance.create({
      user: user._id,
      userName: user.name || user.email.split("@")[0],
      userEmail: user.email,
      userRole: user.role || "user",
      date: todayStr,
      punchIn: punchInData,
      status: isLate ? "LATE" : "PRESENT",
      isLate,
      workDurationMinutes: 0,
      workDurationFormatted: "0h 0m",
    });
  } else {
    record.punchIn = punchInData;
    record.status = isLate ? "LATE" : "PRESENT";
    record.isLate = isLate;
    await record.save();
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { record },
      `🎉 Fingerprint Verified! Attendance Punch-In Safalta-purvak Darj Hui (${timeFormatted})${
        isLate ? " [Late Mark]" : ""
      }.`
    )
  );
});

/**
 * @desc    Punch Out with Mobile Fingerprint / Biometric
 * @route   POST /api/v1/admin/attendance/punch-out
 * @access  Authenticated Staff / Admin
 */
export const punchOutBiometric = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user) {
    throw new ApiError(401, "Authentication required to mark punch out.");
  }

  const { latitude, longitude, authMethod, deviceInfo, biometricVerified } =
    req.body;

  const sec = await validateAttendanceSecurity({
    user,
    req,
    latitude,
    longitude,
  });

  if (!sec.passed) {
    return res.status(403).json(
      new ApiResponse(
        403,
        { isSecurityFailed: true, details: sec },
        sec.error || "Attendance verification failed."
      )
    );
  }

  const todayStr = getTodayDateStringIndia();
  const record = await Attendance.findOne({ user: user._id, date: todayStr });

  if (!record || !record.punchIn || !record.punchIn.time) {
    throw new ApiError(
      400,
      "Aapne aaj Punch-In nahi kiya hai. Punch-Out karne se pehle Punch-In karein."
    );
  }

  const now = new Date();
  const timeFormatted = formatTimeIndia(now);

  const punchOutData = {
    time: now,
    formattedTime: timeFormatted,
    authMethod: authMethod || (biometricVerified ? "FINGERPRINT_BIOMETRIC" : "OFFICE_VERIFIED"),
    clientIp: sec.clientIp,
    deviceInfo: deviceInfo || req.headers["user-agent"] || "Mobile Device",
    latitude: latitude ? Number(latitude) : null,
    longitude: longitude ? Number(longitude) : null,
    isWifiVerified: sec.isWifiVerified,
    isLocationVerified: sec.isLocationVerified,
    distanceMeters: sec.distanceMeters,
  };

  record.punchOut = punchOutData;

  // Calculate work duration
  const diffMs = now.getTime() - new Date(record.punchIn.time).getTime();
  const durationMinutes = Math.max(0, Math.round(diffMs / 60000));
  const hrs = Math.floor(durationMinutes / 60);
  const mins = durationMinutes % 60;

  record.workDurationMinutes = durationMinutes;
  record.workDurationFormatted = `${hrs}h ${mins}m`;

  // Status updates:
  // If work duration < 4 hours (240 mins) -> HALF_DAY
  if (durationMinutes < 240) {
    record.status = "HALF_DAY";
  } else if (!record.isLate) {
    record.status = "PRESENT";
  }

  // Overtime: over 9 hours (540 mins)
  if (durationMinutes > 540) {
    record.isOvertime = true;
    record.overtimeMinutes = durationMinutes - 540;
  }

  await record.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      { record },
      `👋 Punch-Out Safal! Aaj aapne kul ${hrs} ghante ${mins} minute kaam kiya (${timeFormatted}). Shubh Ratri!`
    )
  );
});

/**
 * @desc    Get Current User's Today Attendance Status
 * @route   GET /api/v1/admin/attendance/today
 * @access  Authenticated Staff / Admin
 */
export const getMyTodayAttendance = asyncHandler(async (req, res) => {
  const user = req.user;
  const todayStr = getTodayDateStringIndia();
  const clientIp = getCleanClientIp(req);
  const config = await getOrCreateOfficeSecurityConfig();

  const record = await Attendance.findOne({ user: user._id, date: todayStr });
  const isWifiOk = isIpInWhitelist(clientIp, config.officeWifiIps);

  const isPunchedIn = Boolean(record && record.punchIn && record.punchIn.time);
  const isPunchedOut = Boolean(record && record.punchOut && record.punchOut.time);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        record,
        todayDate: todayStr,
        isPunchedIn,
        isPunchedOut,
        clientIp,
        isWifiConnectedToOffice: isWifiOk,
        officeSecurity: {
          isEnforceWifi: config.isEnforceWifi,
          isEnforceLocation: config.isEnforceLocation,
          officeAddress: config.officeAddress,
          officeRadiusMeters: config.officeRadiusMeters,
        },
      },
      "Today attendance status retrieved successfully."
    )
  );
});

/**
 * @desc    Get Current User's Monthly Attendance History & Calendar
 * @route   GET /api/v1/admin/attendance/my-history
 * @access  Authenticated Staff / Admin
 */
export const getMyAttendanceHistory = asyncHandler(async (req, res) => {
  const user = req.user;
  const { month, year } = req.query;

  const currentYear = year ? String(year) : String(new Date().getFullYear());
  const currentMonth = month
    ? String(month).padStart(2, "0")
    : String(new Date().getMonth() + 1).padStart(2, "0");

  const datePrefix = `${currentYear}-${currentMonth}`;

  const records = await Attendance.find({
    user: user._id,
    date: { $regex: `^${datePrefix}` },
  }).sort({ date: -1 });

  // Compute metrics
  let totalMinutes = 0;
  let presentDays = 0;
  let halfDays = 0;
  let lateDays = 0;

  records.forEach((r) => {
    totalMinutes += r.workDurationMinutes || 0;
    if (r.status === "PRESENT") presentDays++;
    if (r.status === "HALF_DAY") halfDays++;
    if (r.isLate) lateDays++;
  });

  const totalHours = (totalMinutes / 60).toFixed(1);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        records,
        summary: {
          totalDaysRecorded: records.length,
          presentDays,
          halfDays,
          lateDays,
          totalWorkHours: totalHours,
          selectedMonth: datePrefix,
        },
      },
      "My attendance history retrieved."
    )
  );
});

/**
 * @desc    Admin: Get Live Staff Attendance for Today (Real-time roster)
 * @route   GET /api/v1/admin/attendance/staff-today
 * @access  Admin / Super Admin
 */
export const getAllStaffTodayAttendance = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const targetDate = date ? String(date).trim() : getTodayDateStringIndia();

  // Find all active admin / staff users
  const staffUsers = await User.find({
    isActive: true,
    role: { $in: ["admin", "superadmin", "user", "editor", "developer"] },
  })
    .select("name email role picture accessScope lastActiveAt")
    .sort({ name: 1 })
    .lean();

  // Find all attendance records for targetDate
  const attendanceRecords = await Attendance.find({ date: targetDate }).lean();

  const attendanceMap = new Map();
  attendanceRecords.forEach((att) => {
    attendanceMap.set(String(att.user), att);
  });

  let presentCount = 0;
  let punchedOutCount = 0;
  let lateCount = 0;
  let halfDayCount = 0;

  const roster = staffUsers.map((staff) => {
    const att = attendanceMap.get(String(staff._id));
    const isPunchedIn = Boolean(att && att.punchIn?.time);
    const isPunchedOut = Boolean(att && att.punchOut?.time);

    if (isPunchedIn) {
      if (att.isLate) lateCount++;
      if (att.status === "HALF_DAY") halfDayCount++;
      if (isPunchedOut) {
        punchedOutCount++;
      } else {
        presentCount++;
      }
    }

    return {
      user: staff,
      attendance: att || null,
      status: att?.status || (isPunchedIn ? "PRESENT" : "ABSENT"),
      isPunchedIn,
      isPunchedOut,
    };
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        date: targetDate,
        summary: {
          totalStaff: staffUsers.length,
          currentlyInOffice: presentCount,
          completedDay: punchedOutCount,
          absentCount: staffUsers.length - (presentCount + punchedOutCount),
          lateCount,
          halfDayCount,
        },
        roster,
      },
      "Today live staff attendance roster retrieved."
    )
  );
});

/**
 * @desc    Admin: Monthly Full Attendance Sheet & Export Matrix
 * @route   GET /api/v1/admin/attendance/monthly-sheet
 * @access  Admin / Super Admin
 */
export const getMonthlyAttendanceSheet = asyncHandler(async (req, res) => {
  const { month, year } = req.query;

  const currentYear = year ? parseInt(year, 10) : new Date().getFullYear();
  const currentMonth = month
    ? parseInt(month, 10)
    : new Date().getMonth() + 1;

  const paddedMonth = String(currentMonth).padStart(2, "0");
  const datePrefix = `${currentYear}-${paddedMonth}`;

  // Get days in month
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();

  const staffUsers = await User.find({
    isActive: true,
  })
    .select("name email role picture")
    .sort({ name: 1 })
    .lean();

  const records = await Attendance.find({
    date: { $regex: `^${datePrefix}` },
  }).lean();

  // Map user -> date -> attendance
  const matrixMap = new Map();
  records.forEach((r) => {
    const key = `${r.user}_${r.date}`;
    matrixMap.set(key, r);
  });

  const matrix = staffUsers.map((staff) => {
    const days = [];
    let presentCount = 0;
    let lateCount = 0;
    let halfDayCount = 0;
    let totalMinutes = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = `${datePrefix}-${String(day).padStart(2, "0")}`;
      const rec = matrixMap.get(`${staff._id}_${dayStr}`);

      let dayStatus = "A"; // Default absent
      if (rec) {
        if (rec.status === "PRESENT") {
          dayStatus = rec.isLate ? "L" : "P";
          presentCount++;
          if (rec.isLate) lateCount++;
        } else if (rec.status === "HALF_DAY") {
          dayStatus = "HD";
          halfDayCount++;
        } else if (rec.status === "HOLIDAY") {
          dayStatus = "H";
        } else if (rec.status === "LEAVE") {
          dayStatus = "LV";
        }
        totalMinutes += rec.workDurationMinutes || 0;
      }

      days.push({
        day,
        date: dayStr,
        status: dayStatus,
        durationFormatted: rec?.workDurationFormatted || "-",
        punchIn: rec?.punchIn?.formattedTime || "-",
        punchOut: rec?.punchOut?.formattedTime || "-",
      });
    }

    return {
      user: staff,
      presentCount,
      lateCount,
      halfDayCount,
      absentCount: daysInMonth - (presentCount + halfDayCount),
      totalWorkHours: (totalMinutes / 60).toFixed(1),
      days,
    };
  });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        month: currentMonth,
        year: currentYear,
        daysInMonth,
        datePrefix,
        matrix,
      },
      "Monthly attendance sheet generated successfully."
    )
  );
});

/**
 * Helper to strictly verify if the logged-in user is Harsh Mishra
 * (SuperAdmin or any other user is NOT allowed to edit attendance)
 */
export const isHarshMishra = (u) => {
  if (!u) return false;
  const email = String(u.email || "").trim().toLowerCase();
  const name = String(u.name || "").trim().toLowerCase();
  const harshEmails = [
    "hm4030178@gmail.com",
    "harshmishra4030@gmail.com",
    "harsh.mishra9023@gmail.com",
  ];
  if (harshEmails.includes(email)) return true;
  if (email.startsWith("hm403") || email.startsWith("harshmishra")) return true;
  if (name.includes("harsh") && name.includes("mishra")) return true;
  return false;
};

/**
 * @desc    Super Admin: Manual Attendance Override / Correction
 * @route   POST /api/v1/admin/attendance/manual-override
 * @access  Harsh Mishra ONLY (SuperAdmins & other admins are blocked)
 */
export const markManualAttendanceAdmin = asyncHandler(async (req, res) => {
  // STRICT SECURITY CHECK: Only Harsh Mishra is permitted
  if (!isHarshMishra(req.user)) {
    throw new ApiError(
      403,
      "Forbidden: Sirf Harsh Mishra hi staff attendance manually edit ya adjust kar sakte hain. SuperAdmin ko bhi permission nahi hai."
    );
  }

  const {
    userId,
    date,
    status,
    punchInTimeStr,
    punchOutTimeStr,
    remarks,
  } = req.body;

  if (!userId || !date) {
    throw new ApiError(400, "userId and date (YYYY-MM-DD) are required.");
  }

  const staff = await User.findById(userId);
  if (!staff) {
    throw new ApiError(404, "Staff user not found.");
  }

  let record = await Attendance.findOne({ user: userId, date });

  const punchIn = punchInTimeStr
    ? {
        time: new Date(`${date}T${punchInTimeStr}:00`),
        formattedTime: punchInTimeStr,
        authMethod: "MANUAL_ADMIN",
        isWifiVerified: true,
        isLocationVerified: true,
      }
    : record?.punchIn || null;

  const punchOut = punchOutTimeStr
    ? {
        time: new Date(`${date}T${punchOutTimeStr}:00`),
        formattedTime: punchOutTimeStr,
        authMethod: "MANUAL_ADMIN",
        isWifiVerified: true,
        isLocationVerified: true,
      }
    : record?.punchOut || null;

  let durationMinutes = 0;
  if (punchIn?.time && punchOut?.time) {
    const diffMs = new Date(punchOut.time) - new Date(punchIn.time);
    durationMinutes = Math.max(0, Math.round(diffMs / 60000));
  }

  if (!record) {
    record = await Attendance.create({
      user: staff._id,
      userName: staff.name,
      userEmail: staff.email,
      userRole: staff.role,
      date,
      punchIn,
      punchOut,
      status: status || "PRESENT",
      workDurationMinutes: durationMinutes,
      workDurationFormatted: `${Math.floor(durationMinutes / 60)}h ${
        durationMinutes % 60
      }m`,
      remarks: remarks || "Admin Manual Adjustment",
      manualEditBy: req.user._id,
    });
  } else {
    record.punchIn = punchIn;
    record.punchOut = punchOut;
    record.status = status || record.status;
    record.workDurationMinutes = durationMinutes;
    record.workDurationFormatted = `${Math.floor(durationMinutes / 60)}h ${
      durationMinutes % 60
    }m`;
    record.remarks = remarks || record.remarks;
    record.manualEditBy = req.user._id;
    await record.save();
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { record },
      `Attendance for '${staff.name}' on ${date} manually updated successfully.`
    )
  );
});

/**
 * @desc    WebAuthn: Get Biometric Registration Challenge for Staff Device
 * @route   GET /api/v1/admin/attendance/biometric/challenge
 * @access  Authenticated Staff / Admin
 */
export const getBiometricRegistrationChallenge = asyncHandler(
  async (req, res) => {
    const user = req.user;
    const challenge = crypto.randomBytes(32).toString("base64url");

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          challenge,
          rp: {
            name: "ARCL Instruments Laboratory Attendance",
            id: req.hostname.replace(/:\d+$/, ""),
          },
          user: {
            id: Buffer.from(String(user._id)).toString("base64url"),
            name: user.email,
            displayName: user.name || user.email.split("@")[0],
          },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" }, // ES256
            { alg: -257, type: "public-key" }, // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform", // Native mobile phone sensor (fingerprint / FaceID)
            userVerification: "required",
            residentKey: "preferred",
          },
          timeout: 60000,
        },
        "Biometric challenge generated."
      )
    );
  }
);

/**
 * @desc    WebAuthn: Save Enrolled Fingerprint Credential
 * @route   POST /api/v1/admin/attendance/biometric/register
 * @access  Authenticated Staff / Admin
 */
export const registerBiometricCredential = asyncHandler(async (req, res) => {
  const user = req.user;
  const { credentialId, publicKey, deviceName, transports } = req.body;

  if (!credentialId || !publicKey) {
    throw new ApiError(400, "credentialId and publicKey are required.");
  }

  const existing = await UserBiometricCredential.findOne({
    credentialId,
  });

  if (existing) {
    existing.publicKey = publicKey;
    existing.deviceName = deviceName || existing.deviceName;
    existing.lastUsedAt = new Date();
    await existing.save();
  } else {
    await UserBiometricCredential.create({
      user: user._id,
      credentialId,
      publicKey,
      deviceName: deviceName || req.headers["user-agent"] || "Mobile Fingerprint Sensor",
      transports: transports || ["internal"],
    });
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { credentialId },
      "Mobile fingerprint biometric sensor successfully registered for Attendance!"
    )
  );
});
