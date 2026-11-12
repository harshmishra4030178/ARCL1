import express from "express";
import upload from "../../middlewares/multer.js";
import {
  createExpense,
  logZeroExpenseToday,
  getExpenses,
  getUserExpenseAccounts,
  getUserDailyStatus,
  getExpenseNotifications,
  markExpenseNotificationRead,
  updateExpenseStatus,
  deleteExpense,
  exportExpensesCsv,
} from "../../controllers/admin/expenseController.js";

const router = express.Router();

router.post("/", upload.single("receipt"), createExpense);
router.post("/zero-today", logZeroExpenseToday);
router.get("/", getExpenses);
router.get("/accounts", getUserExpenseAccounts);
router.get("/daily-status", getUserDailyStatus);
router.get("/notifications", getExpenseNotifications);
router.patch("/notifications/:id/read", markExpenseNotificationRead);
router.patch("/:id/status", updateExpenseStatus);
router.delete("/:id", deleteExpense);
router.get("/export", exportExpensesCsv);

export default router;
