/**
 * Role-Based Access Control (RBAC) Client Utilities
 */

export const isSuperAdmin = (user) => {
  if (!user) return false;
  if (user.role === "superadmin") return true;
  if (user.email?.toLowerCase() === "abhinav@arclinstruments.com") return true;
  if (user.email?.toLowerCase() === "abhinavtripathi32@gmail.com") return true;
  return false;
};

export const hasModuleAccess = (user, moduleName, actionName = null) => {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;

  const perms = user.permissions || {};
  const modPerms = perms[moduleName];
  if (modPerms === undefined) {
    // If admin has role "admin", grant access by default to newly added modules
    return user.role === "admin";
  }

  if (actionName) {
    if (modPerms[actionName] !== undefined) {
      return modPerms[actionName] === true;
    }
    // Backward compatibility mappings for calibration module
    if (moduleName === "calibration") {
      if (actionName === "inward_register") {
        if (modPerms.srf_history !== undefined) return modPerms.srf_history === true;
        if (modPerms.create !== undefined) return modPerms.create === true;
      }
      if (actionName === "srf_history" && modPerms.create !== undefined) return modPerms.create === true;
      if (actionName === "quotations" && modPerms.documents !== undefined) return modPerms.documents === true;
      if (actionName === "reminders" && modPerms.dispatch !== undefined) return modPerms.dispatch === true;
    }
    // If user is admin and the key wasn't explicitly set to false, default to true
    return user.role === "admin";
  }

  // Check if at least one permission is true in this module
  return Object.values(modPerms).some((val) => val === true);
};

export const ROUTE_PERMISSIONS = [
  { prefix: "/admin/products", module: "products" },
  { prefix: "/admin/inventory", module: "inventory" },
  { prefix: "/admin/sales", module: "sales" },
  { prefix: "/admin/categories", module: "categories" },
  { prefix: "/admin/equipment-types", module: "equipmentTypes" },
  { prefix: "/admin/calibration/payments", module: "calibration", action: "payments" },
  { prefix: "/admin/expenses", module: "expenses" },
  { prefix: "/admin/salary", module: "salary" },
  { prefix: "/admin/calibration", module: "calibration" },
  { prefix: "/admin/blogs", module: "blogs" },
  { prefix: "/admin/inquiry", module: "inquiries" },
  { prefix: "/admin/contact-messages", module: "contacts" },
  { prefix: "/admin/subscribers", module: "subscribers" },
  { prefix: "/admin/users", module: "users", action: "manage" },
];

export const checkPathAccess = (pathname, user) => {
  if (!pathname || pathname === "/admin" || pathname === "/admin/login") {
    return true; // Dashboard & Login accessible
  }

  for (const rule of ROUTE_PERMISSIONS) {
    if (pathname.startsWith(rule.prefix)) {
      if (pathname.includes("/create")) {
        return hasModuleAccess(user, rule.module, "create");
      }
      if (pathname.includes("/edit")) {
        return hasModuleAccess(user, rule.module, "edit");
      }
      return hasModuleAccess(user, rule.module, rule.action || null);
    }
  }

  return true;
};
