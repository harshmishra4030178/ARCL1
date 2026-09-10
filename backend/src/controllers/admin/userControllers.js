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

  const now = new Date();
  const fortyFiveSecondsAgo = new Date(now.getTime() - 45 * 1000);
  const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);

  const enrichedUsers = users.map((u) => {
    const userObj = u.toObject();
    const lastActive = userObj.lastActiveAt;

    let activeStatus = "offline";
    if (lastActive && new Date(lastActive) >= fortyFiveSecondsAgo) {
      activeStatus = "online";
    } else if (lastActive && new Date(lastActive) >= twoMinutesAgo) {
      activeStatus = "away";
    }

    userObj.isOnline = activeStatus === "online";
    userObj.activeStatus = activeStatus;
    userObj.lastActiveAt = lastActive;
    return userObj;
  });

  // Calculate high level metrics
  const totalCount = await User.countDocuments();
  const adminCount = await User.countDocuments({
    role: { $in: ["admin", "superadmin"] },
  });
  const userCount = await User.countDocuments({ role: "user" });
  const activeCount = await User.countDocuments({ isActive: true });
  const onlineCount = enrichedUsers.filter((u) => u.isOnline).length;

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        users: enrichedUsers,
        metrics: {
          total: totalCount,
          admins: adminCount,
          users: userCount,
          active: activeCount,
          online: onlineCount,
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

  // Safety: Prevent changing Super Admin role
  const envAdminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const isSuper =
    user.role === "superadmin" ||
    user.email.toLowerCase() === "abhinav@arclinstruments.com" ||
    user.email.toLowerCase() === "abhinavtripathi32@gmail.com" ||
    user.email.toLowerCase() === envAdminEmail;

  if (isSuper) {
    throw new ApiError(
      400,
      `Super Administrator (${user.email}) role is permanently locked and cannot be changed.`
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

  // Safety: Prevent deactivating Super Admin
  const envAdminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const isSuper =
    user.role === "superadmin" ||
    user.email.toLowerCase() === "abhinav@arclinstruments.com" ||
    user.email.toLowerCase() === "abhinavtripathi32@gmail.com" ||
    user.email.toLowerCase() === envAdminEmail;

  if (isSuper) {
    throw new ApiError(
      400,
      "Super Administrator account cannot be deactivated or suspended."
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

  // Safety: Prevent deleting Super Admin
  const envAdminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const isSuper =
    user.role === "superadmin" ||
    user.email.toLowerCase() === "abhinav@arclinstruments.com" ||
    user.email.toLowerCase() === "abhinavtripathi32@gmail.com" ||
    user.email.toLowerCase() === envAdminEmail;

  if (isSuper) {
    throw new ApiError(
      400,
      "Super Administrator account is protected and cannot be deleted."
    );
  }

  await User.findByIdAndDelete(id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "User deleted successfully."));
});

/**
 * @desc    Update User Permissions & Role
 * @route   PATCH /api/v1/admin/users/:id/permissions
 * @access  Admin
 */
export const updateUserPermissions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { permissions, role } = req.body;

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  // Safety: Prevent modifying Super Admin permissions
  const envAdminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const isSuper =
    user.role === "superadmin" ||
    user.email.toLowerCase() === "abhinav@arclinstruments.com" ||
    user.email.toLowerCase() === "abhinavtripathi32@gmail.com" ||
    user.email.toLowerCase() === envAdminEmail;

  if (isSuper) {
    throw new ApiError(
      400,
      "Super Administrator permissions are fully enabled and cannot be altered."
    );
  }

  if (role) {
    user.role = role;
  }

  if (permissions) {
    user.permissions = {
      ...user.permissions,
      ...permissions,
    };
    user.markModified("permissions");
  }

  await user.save();

  return res.status(200).json(
    new ApiResponse(
      200,
      user,
      `Permissions for '${user.email}' updated successfully.`
    )
  );
});

/**
 * @desc    Grant User Access / Pre-authorize Admin by Email with Custom Permissions
 * @route   POST /api/v1/admin/users/grant-access
 * @access  Admin
 */
export const grantUserAccess = asyncHandler(async (req, res) => {
  const { email, role = "admin", name, permissions } = req.body;

  if (!email || !email.trim()) {
    throw new ApiError(400, "Valid email address is required.");
  }

  const cleanEmail = email.trim().toLowerCase();

  // Basic email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    throw new ApiError(400, "Please provide a valid email format.");
  }

  const defaultPermissions = {
    products: { create: true, edit: true, delete: true },
    categories: { create: true, edit: true, delete: true },
    equipmentTypes: { create: true, edit: true, delete: true },
    blogs: { create: true, edit: true, delete: true },
    inquiries: { view: true, delete: true },
    contacts: { view: true, delete: true },
    subscribers: { view: true, delete: true },
    users: { manage: role === "admin" || role === "superadmin" },
  };

  const finalPermissions = permissions ? { ...defaultPermissions, ...permissions } : defaultPermissions;

  let user = await User.findOne({ email: cleanEmail });

  if (user) {
    user.role = role;
    user.isActive = true;
    if (name && name.trim()) user.name = name.trim();
    if (permissions) {
      user.permissions = finalPermissions;
      user.markModified("permissions");
    }
    await user.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        user,
        `Access updated: '${cleanEmail}' is now assigned role '${role.toUpperCase()}'.`
      )
    );
  } else {
    // Create new pre-authorized user record
    const displayName =
      name && name.trim()
        ? name.trim()
        : cleanEmail.split("@")[0].replace(/[._-]/g, " ");

    user = await User.create({
      name: displayName,
      email: cleanEmail,
      role,
      permissions: finalPermissions,
      isActive: true,
      lastLogin: null,
    });

    return res.status(201).json(
      new ApiResponse(
        201,
        user,
        `New account created & '${role.toUpperCase()}' access granted to '${cleanEmail}'.`
      )
    );
  }
});
