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
    // Default: ARCL Instruments & Calibration Laboratory (Airoli, Navi Mumbai)
    officeLatitude: {
      type: Number,
      default: 19.1553,
    },
    officeLongitude: {
      type: Number,
      default: 72.9982,
    },
    // Allowed radius in meters from office coordinates
    officeRadiusMeters: {
      type: Number,
      default: 150, // 150m covers the laboratory premises & immediate vicinity
    },
    // Toggle GPS Geofence enforcement for OFFICE_ONLY users
    isEnforceLocation: {
      type: Boolean,
      default: true,
    },
    officeAddress: {
      type: String,
      default: "Shop No. 6, Siddhivinayak Park CHS, Sector - 8A, Airoli, Navi Mumbai, Maharashtra - 400708",
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
