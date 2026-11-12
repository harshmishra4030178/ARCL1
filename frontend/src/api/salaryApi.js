import API from "./axios";

// 1. Get all employee salary structures & unconfigured staff
export const getSalaryStructuresApi = () =>
  API.get("/admin/salary/structures");

// 2. Save / update an employee salary structure & bank details
export const upsertSalaryStructureApi = (data) =>
  API.post("/admin/salary/structures", data);

// 3. Get monthly payroll slips with summary stats
export const getMonthlyPayrollApi = (params = {}) =>
  API.get("/admin/salary/payroll", { params });

// 4. Generate monthly payroll for all active staff (or specific user)
export const generateMonthlyPayrollApi = (data = {}) =>
  API.post("/admin/salary/payroll/generate", data);

// 5. Update attendance, earnings, or deductions on a salary slip
export const updateSalarySlipApi = (id, data) =>
  API.put(`/admin/salary/payroll/${id}`, data);

// 6. Mark a salary slip as Paid (disburse with UTR, mode, payment date)
export const markSalaryPaidApi = (id, data) =>
  API.patch(`/admin/salary/payroll/${id}/pay`, data);

// 7. Delete a draft/unpaid salary slip
export const deleteSalarySlipApi = (id) =>
  API.delete(`/admin/salary/payroll/${id}`);

// 8. Get salary advance requests & active loans
export const getSalaryAdvancesApi = () =>
  API.get("/admin/salary/advances");

// 9. Issue a new salary advance
export const createSalaryAdvanceApi = (data) =>
  API.post("/admin/salary/advances", data);

// 10. Update salary advance status (clear/cancel)
export const updateSalaryAdvanceStatusApi = (id, data) =>
  API.patch(`/admin/salary/advances/${id}`, data);

// 11. Get annual payroll analytics & statutory summaries
export const getPayrollAnalyticsApi = () =>
  API.get("/admin/salary/analytics");
