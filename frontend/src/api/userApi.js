import API from "./axios";

// Get all users with search/role filters
export const getAdminUsersApi = (params = {}) =>
  API.get("/admin/users", { params });

// Update user role ('admin' | 'user' | 'developer' | 'superadmin')
export const updateUserRoleApi = (id, role) =>
  API.patch(`/admin/users/${id}/role`, { role });

// Update user login access scope ('ANYWHERE' | 'OFFICE_ONLY')
export const updateUserAccessScopeApi = (id, accessScope) =>
  API.patch(`/admin/users/${id}/access-scope`, { accessScope });

// Toggle user active status
export const toggleUserStatusApi = (id) =>
  API.patch(`/admin/users/${id}/toggle-status`);

// Grant or pre-authorize role access by email with custom permissions
export const grantUserAccessApi = (data) =>
  API.post("/admin/users/grant-access", data);

// Update user permissions & role & accessScope
export const updateUserPermissionsApi = (id, data) =>
  API.patch(`/admin/users/${id}/permissions`, data);

// Delete user
export const deleteUserApi = (id) => API.delete(`/admin/users/${id}`);
