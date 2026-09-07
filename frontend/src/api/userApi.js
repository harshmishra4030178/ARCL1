import API from "./axios";

// Get all users with search/role filters
export const getAdminUsersApi = (params = {}) =>
  API.get("/admin/users", { params });

// Update user role ('admin' | 'user')
export const updateUserRoleApi = (id, role) =>
  API.patch(`/admin/users/${id}/role`, { role });

// Toggle user active status
export const toggleUserStatusApi = (id) =>
  API.patch(`/admin/users/${id}/toggle-status`);

// Grant or pre-authorize role access by email with custom permissions
export const grantUserAccessApi = (data) =>
  API.post("/admin/users/grant-access", data);

// Update user permissions & role
export const updateUserPermissionsApi = (id, data) =>
  API.patch(`/admin/users/${id}/permissions`, data);

// Delete user
export const deleteUserApi = (id) => API.delete(`/admin/users/${id}`);
