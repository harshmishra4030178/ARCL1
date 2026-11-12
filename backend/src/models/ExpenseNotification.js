import mongoose from "mongoose";

const expenseNotificationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["NEW_EXPENSE", "DAILY_REMINDER", "EXPENSE_REIMBURSED", "ZERO_EXPENSE_LOGGED"],
      default: "NEW_EXPENSE",
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      default: 0,
    },
    category: {
      type: String,
      default: "",
    },
    expenseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Expense",
      default: null,
    },
    // User who created the expense
    createdByUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    createdByName: {
      type: String,
      default: "Admin",
    },
    createdByPicture: {
      type: String,
      default: "",
    },
    // Target user (null means broadcast to all admins, otherwise specific user e.g. for reminder)
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    // Read status: users who marked this notification as read
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    link: {
      type: String,
      default: "/admin/expenses",
    },
  },
  {
    timestamps: true,
  }
);

const ExpenseNotification =
  mongoose.models.ExpenseNotification ||
  mongoose.model("ExpenseNotification", expenseNotificationSchema);

export default ExpenseNotification;
