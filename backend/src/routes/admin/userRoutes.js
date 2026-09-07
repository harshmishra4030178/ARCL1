import express from "express";
import {
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
  grantUserAccess,
} from "../../controllers/admin/userControllers.js";

const router = express.Router();

router.get("/", getAllUsers);
router.post("/grant-access", grantUserAccess);
router.patch("/:id/role", updateUserRole);
router.patch("/:id/toggle-status", toggleUserStatus);
router.delete("/:id", deleteUser);

export default router;
