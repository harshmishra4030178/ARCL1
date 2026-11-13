import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";
import asyncHandler from "../../utils/asyncHandler.js";
import {
  getOrCreateOfficeSecurityConfig,
  getCleanClientIp,
} from "../../utils/officeSecurityHelper.js";

/**
 * @desc    Get Office Security Settings & Client's Detected IP
 * @route   GET /api/v1/admin/office-security
 * @access  Admin
 */
export const getOfficeSecuritySettings = asyncHandler(async (req, res) => {
  const config = await getOrCreateOfficeSecurityConfig();
  const detectedIp = getCleanClientIp(req);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        config,
        detectedIp,
      },
      "Office security configuration retrieved successfully."
    )
  );
});

/**
 * @desc    Update Office Security Settings (WiFi IPs, GPS, Radius, Toggles)
 * @route   PUT /api/v1/admin/office-security
 * @access  Admin / Super Admin
 */
export const updateOfficeSecuritySettings = asyncHandler(async (req, res) => {
  const {
    officeWifiIps,
    isEnforceWifi,
    officeLatitude,
    officeLongitude,
    officeRadiusMeters,
    isEnforceLocation,
    officeAddress,
  } = req.body;

  const config = await getOrCreateOfficeSecurityConfig();

  if (Array.isArray(officeWifiIps)) {
    // Clean and deduplicate IPs
    const cleanedIps = Array.from(
      new Set(
        officeWifiIps
          .map((ip) => (typeof ip === "string" ? ip.trim() : ""))
          .filter(Boolean)
      )
    );
    config.officeWifiIps = cleanedIps;
  }

  if (typeof isEnforceWifi === "boolean") {
    config.isEnforceWifi = isEnforceWifi;
  }

  if (officeLatitude !== undefined && !isNaN(Number(officeLatitude))) {
    config.officeLatitude = Number(officeLatitude);
  }

  if (officeLongitude !== undefined && !isNaN(Number(officeLongitude))) {
    config.officeLongitude = Number(officeLongitude);
  }

  if (officeRadiusMeters !== undefined && !isNaN(Number(officeRadiusMeters))) {
    config.officeRadiusMeters = Math.max(10, Number(officeRadiusMeters));
  }

  if (typeof isEnforceLocation === "boolean") {
    config.isEnforceLocation = isEnforceLocation;
  }

  if (officeAddress !== undefined) {
    config.officeAddress = String(officeAddress).trim();
  }

  if (req.user?._id) {
    config.updatedBy = req.user._id;
  }

  await config.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      { config, detectedIp: getCleanClientIp(req) },
      "Office network & geofence security settings updated successfully."
    )
  );
});

/**
 * @desc    Auto-register Caller's Current Public IP as Authorized Office WiFi
 * @route   POST /api/v1/admin/office-security/whitelist-current-ip
 * @access  Admin
 */
export const whitelistCurrentIp = asyncHandler(async (req, res) => {
  const detectedIp = getCleanClientIp(req);

  if (!detectedIp) {
    throw new ApiError(400, "Could not accurately detect caller IP address.");
  }

  const config = await getOrCreateOfficeSecurityConfig();

  if (!config.officeWifiIps.includes(detectedIp)) {
    config.officeWifiIps.push(detectedIp);
    if (req.user?._id) config.updatedBy = req.user._id;
    await config.save();
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      { config, detectedIp },
      `Current Network IP '${detectedIp}' successfully added to Authorized Office WiFi Whitelist.`
    )
  );
});

/**
 * @desc    Remove an IP from Authorized Office WiFi Whitelist
 * @route   DELETE /api/v1/admin/office-security/whitelist-ip
 * @access  Admin
 */
export const removeIpFromWhitelist = asyncHandler(async (req, res) => {
  const { ip } = req.body;

  if (!ip) {
    throw new ApiError(400, "IP address is required to remove.");
  }

  const config = await getOrCreateOfficeSecurityConfig();
  const cleanIp = String(ip).trim();

  config.officeWifiIps = config.officeWifiIps.filter(
    (item) => item !== cleanIp
  );

  if (req.user?._id) config.updatedBy = req.user._id;
  await config.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      { config, detectedIp: getCleanClientIp(req) },
      `IP '${cleanIp}' removed from Authorized Office WiFi Whitelist.`
    )
  );
});
