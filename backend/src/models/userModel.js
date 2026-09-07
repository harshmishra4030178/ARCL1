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
        products: { create: true, edit: true, delete: true },
        categories: { create: true, edit: true, delete: true },
        equipmentTypes: { create: true, edit: true, delete: true },
        blogs: { create: true, edit: true, delete: true },
        inquiries: { view: true, delete: true },
        contacts: { view: true, delete: true },
        subscribers: { view: true, delete: true },
        users: { manage: true },
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
