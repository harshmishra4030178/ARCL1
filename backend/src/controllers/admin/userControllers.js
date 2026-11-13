import User from "../../models/userModel.js";
import ApiError from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import asyncHandler from "../../utils/asyncHandler.js";
import { isSuperAdminUser, isPrimarySuperAdminUser, clearAdminUserCache } from "../../middlewares/authMiddleware.js";

/**
 * @desc    Get All Registered Users (Admin)
 * @route   GET /api/v1/admin/users
 * @access  Admin
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const { search, role, status, accessScope } = req.query;

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

  if (accessScope && accessScope !== "all") {
    filter.accessScope = accessScope;
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
    userObj.accessScope = userObj.accessScope || "ANYWHERE";
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
  const officeOnlyCount = await User.countDocuments({ accessScope: "OFFICE_ONLY" });
  const anywhereCount = await User.countDocuments({
    $or: [{ accessScope: "ANYWHERE" }, { accessScope: { $exists: false } }],
  });

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
          officeOnly: officeOnlyCount,
          anywhere: anywhereCount,
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

  if (!["admin", "user", "superadmin", "developer"].includes(role)) {
    throw new ApiError(400, "Invalid role. Role must be 'admin' or 'user'.");
  }

  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  // Safety: Prevent changing Primary Root Super Admin role (Abhinav)
  const isPrimary = isPrimarySuperAdminUser(user);

  if (isPrimary) {
    throw new ApiError(
      400,
      `Primary Super Administrator (${user.email}) role is permanently locked and cannot be changed.`
    );
  }

  user.role = role;
  await user.save();
  clearAdminUserCache(user._id);

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
 * @desc    Update User Login Access Scope (ANYWHERE vs OFFICE_ONLY)
 * @route   PATCH /api/v1/admin/users/:id/access-scope
 * @access  Admin
 */
export const updateUserAccessScope = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { accessScope } = req.body;

  if (!["ANYWHERE", "OFFICE_ONLY"].includes(accessScope)) {
    throw new ApiError(400, "Invalid accessScope. Must be 'ANYWHERE' or 'OFFICE_ONLY'.");
  }

  const user = await User.findById(id);

  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  // Safety: Prevent locking Primary Root Super Administrator to OFFICE_ONLY
  const isPrimary = isPrimarySuperAdminUser(user);
  if (isPrimary && accessScope === "OFFICE_ONLY") {
    throw new ApiError(
      400,
      "Primary Super Administrator account must retain 'ANYWHERE' access for system fail-safe resilience."
    );
  }

  user.accessScope = accessScope;
  await user.save();
  clearAdminUserCache(user._id);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        _id: user._id,
        name: user.name,
        email: user.email,
        accessScope: user.accessScope,
      },
      `User '${user.email}' login restriction updated to '${
        accessScope === "OFFICE_ONLY" ? "Office Only (WiFi + GPS)" : "Anywhere Access"
      }'.`
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

  // Safety: Prevent deactivating Primary Root Super Admin
  const isPrimary = isPrimarySuperAdminUser(user);

  if (isPrimary) {
    throw new ApiError(
      400,
      "Primary Super Administrator account cannot be deactivated or suspended."
    );
  }

  user.isActive = !user.isActive;
  await user.save();
  clearAdminUserCache(user._id);

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

  // Safety: Prevent deleting Primary Root Super Admin
  const isPrimary = isPrimarySuperAdminUser(user);

  if (isPrimary) {
    throw new ApiError(
      400,
      "Primary Super Administrator account is protected and cannot be deleted."
    );
  }

  await User.findByIdAndDelete(id);
  clearAdminUserCache(id);

  return res
    .status(200)
    .json(new ApiResponse(200, null, "User deleted successfully."));
});

/**
 * @desc    Update User Permissions & Role & AccessScope
 * @route   PATCH /api/v1/admin/users/:id/permissions
 * @access  Admin
 */
export const updateUserPermissions = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { permissions, role, accessScope } = req.body;

  const user = await User.findById(id);
  if (!user) {
    throw new ApiError(404, "User not found.");
  }

  // Safety: Prevent modifying Primary Root Super Admin permissions
  const isPrimary = isPrimarySuperAdminUser(user);

  if (isPrimary) {
    throw new ApiError(
      400,
      "Primary Super Administrator permissions are fully enabled and cannot be altered."
    );
  }

  if (role) {
    user.role = role;
  }

  if (accessScope && ["ANYWHERE", "OFFICE_ONLY"].includes(accessScope)) {
    user.accessScope = accessScope;
  }

  if (permissions) {
    user.permissions = {
      ...user.permissions,
      ...permissions,
    };
    user.markModified("permissions");
  }

  await user.save();
  clearAdminUserCache(user._id);

  return res.status(200).json(
    new ApiResponse(
      200,
      user,
      `Permissions for '${user.email}' updated successfully.`
    )
  );
});

/**
 * @desc    Grant User Access / Pre-authorize Admin by Email with Custom Permissions & Access Scope
 * @route   POST /api/v1/admin/users/grant-access
 * @access  Admin
 */
export const grantUserAccess = asyncHandler(async (req, res) => {
  const {
    email,
    role = "admin",
    name,
    permissions,
    accessScope = "ANYWHERE",
  } = req.body;

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
    products: { create: true, edit: true, delete: true }, // 3
    calibration: { create: true, edit: true, documents: true, dispatch: true, delete: true }, // 5
    categories: { create: true, edit: true, delete: true }, // 3
    equipmentTypes: { create: true, delete: true }, // 2
    blogs: { create: true, edit: true, delete: true }, // 3
    inquiries: { view: true, edit: true, delete: true }, // 3
    contacts: { view: true, delete: true }, // 2
    subscribers: { view: true, edit: true, delete: true }, // 3
    users: { manage: role === "admin" || role === "superadmin", delete: role === "superadmin" }, // 2
    expenses: { view: true, create: true, edit: true, delete: true, approve: true }, // 5
    salary: { view: true, create: true, edit: true, delete: true, process: true }, // 5
    developer: { error_logs: true, api_health: true, system_config: true, audit_logs: true }, // 4
  };

  const finalPermissions = permissions ? { ...defaultPermissions, ...permissions } : defaultPermissions;
  const validAccessScope = ["ANYWHERE", "OFFICE_ONLY"].includes(accessScope)
    ? accessScope
    : "ANYWHERE";

  let user = await User.findOne({ email: cleanEmail });

  if (user) {
    user.role = role;
    user.isActive = true;
    user.accessScope = validAccessScope;
    if (name && name.trim()) user.name = name.trim();
    if (permissions) {
      user.permissions = finalPermissions;
      user.markModified("permissions");
    }
    await user.save();
    clearAdminUserCache(user._id);

    return res.status(200).json(
      new ApiResponse(
        200,
        user,
        `Access updated: '${cleanEmail}' is now assigned role '${role.toUpperCase()}' with '${validAccessScope}' login scope.`
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
      accessScope: validAccessScope,
      isActive: true,
      lastLogin: null,
    });

    return res.status(201).json(
      new ApiResponse(
        201,
        user,
        `New account created & '${role.toUpperCase()}' access granted to '${cleanEmail}' (${validAccessScope}).`
      )
    );
  }
});
