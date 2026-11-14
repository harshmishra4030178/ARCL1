import OfficeSecurityConfig from "../models/OfficeSecurityConfig.js";

/**
 * Cleanly extract caller IP address from Express request,
 * accounting for reverse proxies (Render, Vercel, Cloudflare, Nginx, local dev).
 */
export const getCleanClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  const realIp = req.headers["x-real-ip"];
  const cfIp = req.headers["cf-connecting-ip"];
  const reqIp = req.ip;
  const socketIp = req.socket?.remoteAddress;

  let raw = "";
  if (cfIp) {
    raw = cfIp;
  } else if (forwarded) {
    // x-forwarded-for can be a comma-separated list; first one is the client
    raw = forwarded.split(",")[0].trim();
  } else if (realIp) {
    raw = realIp;
  } else if (reqIp) {
    raw = reqIp;
  } else if (socketIp) {
    raw = socketIp;
  }

  // Remove IPv6 mapping prefix if present (e.g. ::ffff:192.168.1.1)
  const cleaned = raw.replace(/^::ffff:/i, "").trim();

  // Normalize localhost
  if (cleaned === "::1" || cleaned === "localhost") {
    return "127.0.0.1";
  }

  return cleaned || "127.0.0.1";
};

/**
 * Calculate distance in meters between two latitude/longitude points using Haversine formula
 */
export const getHaversineDistanceMeters = (lat1, lon1, lat2, lon2) => {
  if (
    lat1 === undefined ||
    lat1 === null ||
    lon1 === undefined ||
    lon1 === null ||
    lat2 === undefined ||
    lat2 === null ||
    lon2 === undefined ||
    lon2 === null
  ) {
    return Infinity;
  }

  const R = 6371e3; // Earth radius in metres
  const rad = Math.PI / 180;
  const φ1 = lat1 * rad;
  const φ2 = lat2 * rad;
  const Δφ = (lat2 - lat1) * rad;
  const Δλ = (lon2 - lon1) * rad;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

/**
 * Check if client IP is present in whitelist, matches wildcard, or matches localhost
 */
export const isIpInWhitelist = (clientIp, allowedIps = []) => {
  if (!clientIp) return false;
  const normalizedClient = clientIp.trim();

  // Always consider localhost allowed in local development
  const localSet = new Set(["127.0.0.1", "::1", "localhost", "0.0.0.0"]);
  if (localSet.has(normalizedClient)) {
    return true;
  }

  return allowedIps.some((allowed) => {
    if (!allowed) return false;
    const cleanAllowed = allowed.replace(/^::ffff:/i, "").trim();
    if (cleanAllowed === normalizedClient) return true;

    // Wildcard matching, e.g. "103.21.12.*" or "103.21.12."
    if (cleanAllowed.endsWith("*")) {
      const prefix = cleanAllowed.slice(0, -1);
      if (normalizedClient.startsWith(prefix)) return true;
    }

    return false;
  });
};

/**
 * Ensure office security configuration document exists in MongoDB
 */
export const getOrCreateOfficeSecurityConfig = async () => {
  let config = await OfficeSecurityConfig.findOne({
    configKey: "DEFAULT_OFFICE_SECURITY",
  });

  if (!config) {
    config = await OfficeSecurityConfig.create({
      configKey: "DEFAULT_OFFICE_SECURITY",
      officeWifiIps: ["127.0.0.1", "::1"],
      isEnforceWifi: true,
      officeLatitude: 19.166533,
      officeLongitude: 73.082750,
      officeRadiusMeters: 150,
      isEnforceLocation: true,
      officeAddress:
        "Shop No. 6, Siddhivinayak Park CHS, Nilaje, Kalyan-Dombivli, Maharashtra, 421204",
      enforceTarget: "ALL_USERS",
      enforceOnSuperAdmin: true,
    });
  } else {
    // Migration: ensure new fields are populated if missing
    let needsSave = false;
    if (config.enforceTarget === undefined || config.enforceTarget === null) {
      config.enforceTarget = "ALL_USERS";
      needsSave = true;
    }
    if (config.enforceOnSuperAdmin === undefined || config.enforceOnSuperAdmin === null) {
      config.enforceOnSuperAdmin = true;
      needsSave = true;
    }
    if (needsSave) {
      await config.save();
    }
  }

  return config;
};

/**
 * Validate login restrictions for a given user.
 * 
 * CORE RULES:
 * 1. If user has accessScope === 'ANYWHERE' (or is SuperAdmin not set to OFFICE_ONLY, or default user):
 *    -> ALLOW LOGIN IMMEDIATELY! (Full remote/home/field access without WiFi or GPS blocks).
 * 
 * 2. If user has accessScope === 'OFFICE_ONLY':
 *    -> STRICT TWO-FACTOR OFFICE VERIFICATION ("Dono cheej mile tbhi login ho"):
 *       Condition 1: Must be connected to Authorized Office WiFi IP.
 *       Condition 2: Must be physically inside Registered Office Geofence (Address).
 *       Both conditions must pass. If either fails, block login with clear error.
 * 
 * 3. If office security toggles are turned OFF (isEnforceWifi === false && isEnforceLocation === false):
 *    -> ALLOW LOGIN.
 */
export const verifyOfficeSecurityAccess = async ({
  user,
  clientIp,
  latitude,
  longitude,
}) => {
  const config = await getOrCreateOfficeSecurityConfig();

  // If both WiFi and Geofence enforcement are toggled off by Admin, allow login
  if (!config.isEnforceWifi && !config.isEnforceLocation) {
    return { allowed: true, reason: "ENFORCEMENT_DISABLED" };
  }

  const isSuperAdmin = user?.role === "superadmin";
  const rawScope = String(user?.accessScope || "").trim().toUpperCase();

  // Only users who are explicitly designated as 'OFFICE_ONLY' are restricted to office premises
  const isOfficeOnly = rawScope === "OFFICE_ONLY";

  // RULE 1: ANYWHERE ACCESS SCOPE (OR SUPER ADMIN DEFAULT)
  // Users with Anywhere scope can log in from home, mobile, field, or any WiFi without restrictions!
  if (!isOfficeOnly) {
    return {
      allowed: true,
      reason: isSuperAdmin ? "SUPERADMIN_ANYWHERE" : "ANYWHERE_ACCESS",
      message: "Unrestricted Anywhere Access: Can log in from any network and location.",
    };
  }

  // ============================================================
  // RULE 2: OFFICE_ONLY ACCESS SCOPE
  // STRICT VALIDATION: "DONO CHEEJ MILE TBHI LOGIN HO"
  // 1) WiFi IP Check
  // 2) GPS Coordinates & Registered Office Geofence Check
  // ============================================================

  // --- Condition 1: Office WiFi Network Check ---
  let wifiPassed = true;
  let wifiDetail = "";
  if (config.isEnforceWifi) {
    const isWifiOk = isIpInWhitelist(clientIp, config.officeWifiIps);
    if (!isWifiOk) {
      wifiPassed = false;
      wifiDetail = `Aapka Network IP (${clientIp}) Authorized Office WiFi Whitelist me darj nahi hai.`;
    }
  }

  // --- Condition 2: Registered Office Address & GPS Geofence Check ---
  let locationPassed = true;
  let locationDetail = "";
  let currentDistanceMeters = null;

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
      locationPassed = false;
      locationDetail = `Browser se live GPS coordinates prapt nahi huye. Kripya browser me location permission allow karein.`;
    } else {
      currentDistanceMeters = getHaversineDistanceMeters(
        numLat,
        numLon,
        config.officeLatitude,
        config.officeLongitude
      );

      if (currentDistanceMeters > config.officeRadiusMeters) {
        locationPassed = false;
        const roundedDist = Math.round(currentDistanceMeters);
        locationDetail = `Aap registered office location se ${roundedDist}m door hain (Anumat daayra: sirf ${config.officeRadiusMeters}m).`;
      }
    }
  }

  // --- ENFORCE COMBINED CONDITIONS (BOTH MUST PASS) ---
  if (!wifiPassed && !locationPassed) {
    return {
      allowed: false,
      reason: "BOTH_FAILED",
      clientIp,
      distanceMeters: currentDistanceMeters ? Math.round(currentDistanceMeters) : null,
      allowedRadius: config.officeRadiusMeters,
      message:
        `🚫 Access Denied: Office WiFi aur Office Address (GPS) dono match nahi huye!\n` +
        `• WiFi Check: ${wifiDetail}\n` +
        `• Location Check: ${locationDetail}\n` +
        `Suraksha niyam: Office-Only accounts ke liye dono cheezein (Office WiFi + Office Geofence) ek sath match hona anivarya hai.`,
    };
  }

  if (!wifiPassed) {
    return {
      allowed: false,
      reason: "WIFI_UNAUTHORIZED",
      clientIp,
      message:
        `🚫 Access Denied: Office WiFi match nahi hua!\n` +
        `• Detected IP: ${clientIp}\n` +
        `• ${wifiDetail}\n` +
        `Kripya Company Office ke Authorized WiFi network se connect karke login karein.`,
    };
  }

  if (!locationPassed) {
    return {
      allowed: false,
      reason: "LOCATION_FAILED",
      distanceMeters: currentDistanceMeters ? Math.round(currentDistanceMeters) : null,
      allowedRadius: config.officeRadiusMeters,
      message:
        `🚫 Access Denied: Office Address / GPS Geofence match nahi hua!\n` +
        `• ${locationDetail}\n` +
        `Kripya Company Office premises (${config.officeAddress || "Office"}) ke andar se login karein.`,
    };
  }

  return {
    allowed: true,
    reason: "OFFICE_VERIFIED",
    message: "Office WiFi aur Registered Address dono successfully verify ho gaye.",
  };
};
