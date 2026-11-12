import express from "express";
import {
  getSalaryStructures,
  upsertSalaryStructure,
  getMonthlyPayroll,
  generateMonthlyPayroll,
  updateSalarySlip,
  markSalaryPaid,
  deleteSalarySlip,
  getSalaryAdvances,
  createSalaryAdvance,
  updateSalaryAdvanceStatus,
  getPayrollAnalytics,
} from "../../controllers/admin/salaryController.js";

const router = express.Router();

// Structures & Profiles
router.route("/structures").get(getSalaryStructures).post(upsertSalaryStructure);

// Payroll & Salary Slips
router.route("/payroll").get(getMonthlyPayroll);
router.route("/payroll/generate").post(generateMonthlyPayroll);
router.route("/payroll/:id").put(updateSalarySlip).delete(deleteSalarySlip);
router.route("/payroll/:id/pay").patch(markSalaryPaid);

// Advances & Loans
router.route("/advances").get(getSalaryAdvances).post(createSalaryAdvance);
router.route("/advances/:id").patch(updateSalaryAdvanceStatus);

// Analytics
router.route("/analytics").get(getPayrollAnalytics);

export default router;
