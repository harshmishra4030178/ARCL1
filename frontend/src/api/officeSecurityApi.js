import API from "./axios";

/**
 * Get Office Security Settings & Caller's Detected IP
 */
export const getOfficeSecuritySettingsApi = () =>
  API.get("/admin/office-security");

/**
 * Update Office Security Settings (WiFi IPs, GPS, Radius, Toggles)
 */
export const updateOfficeSecuritySettingsApi = (data) =>
  API.put("/admin/office-security", data);

/**
 * Auto-whitelist caller's current network IP as Office WiFi
 */
export const whitelistCurrentIpApi = () =>
  API.post("/admin/office-security/whitelist-current-ip");

/**
 * Remove an IP from Office WiFi Whitelist
 */
export const removeIpFromWhitelistApi = (ip) =>
  API.delete("/admin/office-security/whitelist-ip", { data: { ip } });
