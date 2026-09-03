import User from "../../models/userModel.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";

/**
 * @desc    Get All Registered Users (Admin)
 * @route   GET /api/v1/admin/users
 * @access  Admin
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const { search, role, status } = req.query;

  const filter = {};

  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), "i");
    filter.$or = [{ name: regex }, { email: regex }];
  }

  if (role && role !== "all") {
    filter.role = role;
  }

  if (typeof status !== "undefined" && status !== "all") {
    filter.isActive = status === "active" || status === "true";
  }

  const users = await User.find(filter).sort({ createdAt: -1 });

  // Calculate high level metrics
  const totalCount = await User.countDocuments();
  const adminCount = await User.countDocuments({
    role: { $in: ["admin", "superadmin"] },
  });
  const userCount = await User.countDocuments({ role: "user" });
  const activeCount = await User.countDocuments({ isActive: true });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        users,
        metrics: {
          total: totalCount,
          admins: adminCount,
          users: userCount,
          active: activeCount,
        },
      },
      "Users retrieved successfully."
    )
  );
});

/**
 * @desc    Update User Role (Admin -> Promote to Admin or Demote to User)
 * @route   PATCH /api/v1/admin/users/:id/role
 * @access  Admin
 */
export const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!["admin", "user", "superadmin"].includes(role)) {
    throw new ApiError(400, "Invalid role. Role must be 'admin' or 'user'.");
  }

  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  // Safety: Prevent demoting primary .env ADMIN_EMAIL
  const envAdminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (
    user.email.toLowerCase() === envAdminEmail &&
    role !== "admin" &&
    role !== "superadmin"
  ) {
    throw new ApiError(
      400,
      `Cannot demote primary system administrator (${user.email}) defined in .env`
    );
  }

  user.role = role;
  await user.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      },
      `User ${user.email} role updated to '${role.toUpperCase()}' successfully.`
    )
  );
});

/**
 * @desc    Toggle User Active Status (Admin)
 * @route   PATCH /api/v1/admin/users/:id/toggle-status
 * @access  Admin
 */
export const toggleUserStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  // Safety: Prevent deactivating primary .env ADMIN_EMAIL
  const envAdminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (user.email.toLowerCase() === envAdminEmail && user.isActive) {
    throw new ApiError(
      400,
      "Cannot deactivate primary system administrator defined in .env"
    );
  }

  user.isActive = !user.isActive;
  await user.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      { _id: user._id, isActive: user.isActive },
      `User ${user.isActive ? "activated" : "deactivated"} successfully.`
    )
  );
});

/**
 * @desc    Delete User (Admin)
 * @route   DELETE /api/v1/admin/users/:id
 * @access  Admin
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  // Safety: Prevent deleting primary .env ADMIN_EMAIL
  const envAdminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  if (user.email.toLowerCase() === envAdminEmail) {
    throw new ApiError(
      400,
      "Cannot delete primary system administrator defined in .env"
    );
  }

  await User.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "User deleted successfully."));
});
