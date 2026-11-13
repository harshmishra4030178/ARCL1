import mongoose from "mongoose";

const officeSecurityConfigSchema = new mongoose.Schema(
  {
    configKey: {
      type: String,
      default: "DEFAULT_OFFICE_SECURITY",
      unique: true,
    },
    // Whitelisted Office Public IPs & Gateway subnets
    officeWifiIps: {
      type: [String],
      default: ["127.0.0.1", "::1"],
    },
    // Toggle WiFi enforcement for OFFICE_ONLY users
    isEnforceWifi: {
      type: Boolean,
      default: true,
    },
    // Office GPS Geofence coordinates
    // Default: ARCL Instruments & Calibration Laboratory (Siddhivinayak Park CHS, Nilaje, Dombivli)
    officeLatitude: {
      type: Number,
      default: 19.166533,
    },
    officeLongitude: {
      type: Number,
      default: 73.082750,
    },
    // Allowed radius in meters from office coordinates
    officeRadiusMeters: {
      type: Number,
      default: 150, // 150m covers the laboratory premises & immediate vicinity
    },
    // Toggle GPS Geofence enforcement for users
    isEnforceLocation: {
      type: Boolean,
      default: true,
    },
    officeAddress: {
      type: String,
      default:
        "Shop No. 6, Siddhivinayak Park CHS, Nilaje, Kalyan-Dombivli, Maharashtra, 421204",
    },
    // Policy Enforcement Target:
    // 'ALL_USERS'         -> Apply to all logins (Strict: WiFi + GPS required for everyone unless exempted with Anywhere scope)
    // 'OFFICE_ONLY_USERS' -> Apply only to users set to OFFICE_ONLY in user table
    enforceTarget: {
      type: String,
      enum: ["ALL_USERS", "OFFICE_ONLY_USERS"],
      default: "ALL_USERS",
    },
    // Whether SuperAdmin is also verified strictly when accessing from Office
    enforceOnSuperAdmin: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("OfficeSecurityConfig", officeSecurityConfigSchema);
