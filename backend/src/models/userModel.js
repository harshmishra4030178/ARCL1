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
      enum: ["admin", "superadmin", "user", "editor"],
      default: "user", // Default role for any new registrant is standard user
    },
    permissions: {
      type: Object,
      default: {
        products: { create: true, edit: true, delete: true }, // 3
        calibration: { create: true, edit: true, documents: true, dispatch: true, delete: true }, // 5
        categories: { create: true, edit: true, delete: true }, // 3
        equipmentTypes: { create: true, delete: true }, // 2
        blogs: { create: true, edit: true, delete: true }, // 3
        inquiries: { view: true, edit: true, delete: true }, // 3
        contacts: { view: true, delete: true }, // 2
        subscribers: { view: true, edit: true, delete: true }, // 3
        users: { manage: true, delete: true }, // 2
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
