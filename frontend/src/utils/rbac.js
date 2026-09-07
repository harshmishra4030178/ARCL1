/**
 * Role-Based Access Control (RBAC) Client Utilities
 */

export const isSuperAdmin = (user) => {
  if (!user) return false;
  if (user.role === "superadmin") return true;
  if (user.email?.toLowerCase() === "admin@arcl.com") return true;
  return false;
};

export const hasModuleAccess = (user, moduleName, actionName = null) => {
  if (!user) return false;
  if (isSuperAdmin(user)) return true;

  const perms = user.permissions || {};
  const modPerms = perms[moduleName];
  if (!modPerms) return false;

  if (actionName) {
    return modPerms[actionName] === true;
  }

  // Check if at least one permission is true in this module
  return Object.values(modPerms).some((val) => val === true);
};

export const ROUTE_PERMISSIONS = [
  { prefix: "/admin/products", module: "products" },
  { prefix: "/admin/categories", module: "categories" },
  { prefix: "/admin/equipment-types", module: "equipmentTypes" },
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
