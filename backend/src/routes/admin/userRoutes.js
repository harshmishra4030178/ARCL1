import express from "express";
import {
  getAllUsers,
  updateUserRole,
  updateUserAccessScope,
  toggleUserStatus,
  deleteUser,
  grantUserAccess,
  updateUserPermissions,
} from "../../controllers/admin/userControllers.js";

const router = express.Router();

router.get("/", getAllUsers);
router.post("/grant-access", grantUserAccess);
router.patch("/:id/role", updateUserRole);
router.patch("/:id/access-scope", updateUserAccessScope);
router.patch("/:id/permissions", updateUserPermissions);
router.patch("/:id/toggle-status", toggleUserStatus);
router.delete("/:id", deleteUser);

export default router;
