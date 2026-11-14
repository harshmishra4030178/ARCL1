import mongoose from "mongoose";

const punchSchema = new mongoose.Schema(
  {
    time: {
      type: Date,
      default: Date.now,
    },
    formattedTime: {
      type: String,
      default: "", // e.g. "09:35 AM"
    },
    authMethod: {
      type: String,
      enum: [
        "FINGERPRINT_BIOMETRIC",
        "FACE_ID",
        "PASSKEY",
        "OFFICE_VERIFIED",
        "MANUAL_ADMIN",
      ],
      default: "FINGERPRINT_BIOMETRIC",
    },
    clientIp: {
      type: String,
      default: "",
    },
    deviceInfo: {
      type: String,
      default: "", // Browser / Mobile Model info
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    isWifiVerified: {
      type: Boolean,
      default: true,
    },
    isLocationVerified: {
      type: Boolean,
      default: true,
    },
    distanceMeters: {
      type: Number,
      default: null,
    },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    userName: {
      type: String,
      default: "",
    },
    userEmail: {
      type: String,
      default: "",
    },
    userRole: {
      type: String,
      default: "user",
    },
    // ISO Date string for fast indexed queries: YYYY-MM-DD (e.g. "2026-11-14")
    date: {
      type: String,
      required: true,
      index: true,
    },
    punchIn: {
      type: punchSchema,
      default: null,
    },
    punchOut: {
      type: punchSchema,
      default: null,
    },
    workDurationMinutes: {
      type: Number,
      default: 0,
    },
    workDurationFormatted: {
      type: String,
      default: "0h 0m",
    },
    status: {
      type: String,
      enum: ["PRESENT", "HALF_DAY", "LATE", "ABSENT", "HOLIDAY", "LEAVE"],
      default: "PRESENT",
      index: true,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    isOvertime: {
      type: Boolean,
      default: false,
    },
    overtimeMinutes: {
      type: Number,
      default: 0,
    },
    remarks: {
      type: String,
      default: "",
    },
    manualEditBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// One attendance record per user per day
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

export default mongoose.model("Attendance", attendanceSchema);
