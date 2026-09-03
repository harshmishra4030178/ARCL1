import express from "express";
import {
  getAllUsers,
  updateUserRole,
  toggleUserStatus,
  deleteUser,
} from "../../controllers/admin/userControllers.js";

const router = express.Router();

router.get("/", getAllUsers);
router.patch("/:id/role", updateUserRole);
router.patch("/:id/toggle-status", toggleUserStatus);
router.delete("/:id", deleteUser);

export default router;
