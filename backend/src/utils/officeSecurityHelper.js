import OfficeSecurityConfig from "../models/OfficeSecurityConfig.js";

/**
 * Cleanly extract caller IP address from Express request,
 * accounting for reverse proxies (Render, Vercel, Cloudflare, Nginx, local dev).
 */
export const getCleanClientIp = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  const realIp = req.headers["x-real-ip"];
  const cfIp = req.headers["cf-connecting-ip"];
  const socketIp = req.socket?.remoteAddress;

  let raw = "";
  if (cfIp) {
    raw = cfIp;
  } else if (forwarded) {
    // x-forwarded-for can be a comma-separated list; first one is the client
    raw = forwarded.split(",")[0].trim();
  } else if (realIp) {
    raw = realIp;
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
 * Check if client IP is present in whitelist or matches localhost
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
    return cleanAllowed === normalizedClient;
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
      officeLatitude: 19.1553,
      officeLongitude: 72.9982,
      officeRadiusMeters: 150,
      isEnforceLocation: true,
      officeAddress:
        "Shop No. 6, Siddhivinayak Park CHS, Sector - 8A, Airoli, Navi Mumbai, Maharashtra - 400708",
    });
  }

  return config;
};

/**
 * Validate login restrictions for a given user.
 * - Superadmin always bypasses restrictions.
 * - accessScope === 'ANYWHERE' bypasses restrictions.
 * - accessScope === 'OFFICE_ONLY' validates WiFi IP and GPS coordinates against OfficeSecurityConfig.
 */
export const verifyOfficeSecurityAccess = async ({
  user,
  clientIp,
  latitude,
  longitude,
}) => {
  // 1. Superadmin role has absolute emergency bypass
  if (user?.role === "superadmin") {
    return { allowed: true, reason: "SUPERADMIN_BYPASS" };
  }

  // 2. Anywhere access scope bypasses office restrictions
  const accessScope = user?.accessScope || "ANYWHERE";
  if (accessScope === "ANYWHERE") {
    return { allowed: true, reason: "ANYWHERE_ACCESS" };
  }

  // 3. User is designated as OFFICE_ONLY -> load active security policy
  const config = await getOrCreateOfficeSecurityConfig();

  // WiFi Network Check
  if (config.isEnforceWifi) {
    const isWifiOk = isIpInWhitelist(clientIp, config.officeWifiIps);
    if (!isWifiOk) {
      return {
        allowed: false,
        reason: "WIFI_UNAUTHORIZED",
        clientIp,
        message:
          `Access Denied: Aap Company Office ke authorized WiFi network se connected nahi hain. ` +
          `(Detected IP: ${clientIp}). Yeh account sirf Office WiFi par login ke liye authorized hai.`,
      };
    }
  }

  // GPS Geofence Check
  if (config.isEnforceLocation) {
    const numLat = parseFloat(latitude);
    const numLon = parseFloat(longitude);

    if (isNaN(numLat) || isNaN(numLon)) {
      return {
        allowed: false,
        reason: "LOCATION_REQUIRED",
        message:
          "Access Denied: GPS Location access anivarya hai. Kripya browser me location permission allow karein aur company office premises ke andar se login karein.",
      };
    }

    const distanceMeters = getHaversineDistanceMeters(
      numLat,
      numLon,
      config.officeLatitude,
      config.officeLongitude
    );

    if (distanceMeters > config.officeRadiusMeters) {
      const roundedDistance = Math.round(distanceMeters);
      return {
        allowed: false,
        reason: "GEOFENCE_EXCEEDED",
        distanceMeters: roundedDistance,
        allowedRadius: config.officeRadiusMeters,
        message:
          `Access Denied: Aap Company Office location ke daayre se bahar hain (${roundedDistance}m door, anumati sirf ${config.officeRadiusMeters}m tak hai). ` +
          `Yeh account sirf Office premises ke andar login ke liye authorized hai.`,
      };
    }
  }

  return { allowed: true, reason: "OFFICE_VERIFIED" };
};
