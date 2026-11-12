import API from "./axios";

// 1. Create a new expense (supports FormData with receipt file attachment)
export const createExpenseApi = (formData) =>
  API.post("/admin/expenses", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

// 2. 1-Click Zero Expense Day Confirmation
export const logZeroExpenseTodayApi = () =>
  API.post("/admin/expenses/zero-today");

// 3. Get expenses with filters (userId, datePreset, startDate, endDate, category, status, search, page)
export const getExpensesApi = (params = {}) =>
  API.get("/admin/expenses", { params });

// 4. Get registered staff accounts & ledger summaries
export const getUserExpenseAccountsApi = () =>
  API.get("/admin/expenses/accounts");

// 5. Get current user's daily status & reminder alert
export const getUserDailyStatusApi = () =>
  API.get("/admin/expenses/daily-status");

// 6. Get real-time broadcast expense notifications feed
export const getExpenseNotificationsApi = () =>
  API.get("/admin/expenses/notifications");

// 7. Mark expense notification as read
export const markExpenseNotificationReadApi = (id = "all") =>
  API.patch(`/admin/expenses/notifications/${id}/read`);

// 8. Update expense status (Approved / Rejected / Reimbursed)
export const updateExpenseStatusApi = (id, data) =>
  API.patch(`/admin/expenses/${id}/status`, data);

// 9. Delete an expense
export const deleteExpenseApi = (id) =>
  API.delete(`/admin/expenses/${id}`);

// 10. Export filtered expenses CSV
export const exportExpensesCsvApi = (params = {}) =>
  API.get("/admin/expenses/export", {
    params,
    responseType: "blob",
  });
