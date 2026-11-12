import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    picture: {
      type: String,
      default: "",
    },
    googleId: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["admin", "superadmin", "user", "editor", "developer"],
      default: "user", // Default role for any new registrant is standard user
    },
    permissions: {
      type: Object,
      default: {
        products: { create: true, edit: true, delete: true }, // 3
        calibration: {
          dashboard: true,
          quotations: true,
          srf_history: true,
          reminders: true,
          observations: true,
          authorization: true,
          templates: true,
          lab_profile: true,
          payments: true,
          financials: true,
          edit: true,
          delete: true,
          create: true,
          documents: true,
          dispatch: true,
        }, // 12 permissions across all 10 sections + edit/delete
        categories: { create: true, edit: true, delete: true }, // 3
        equipmentTypes: { create: true, delete: true }, // 2
        blogs: { create: true, edit: true, delete: true }, // 3
        inquiries: { view: true, edit: true, delete: true }, // 3
        contacts: { view: true, delete: true }, // 2
        subscribers: { view: true, edit: true, delete: true }, // 3
        users: { manage: true, delete: true }, // 2
        expenses: { view: true, create: true, edit: true, delete: true, approve: true }, // 5
        salary: { view: true, create: true, edit: true, delete: true, process: true }, // 5
        developer: { error_logs: true, api_health: true, system_config: true, audit_logs: true }, // 4
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    lastActiveAt: {
      type: Date,
      default: null,
    },
    currentIp: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
