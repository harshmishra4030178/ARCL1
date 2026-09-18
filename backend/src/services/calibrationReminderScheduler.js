import CalibrationRecord from "../models/CalibrationRecord.js";
import { sendCalibrationDueEmail } from "../utils/emailService.js";

// Global in-memory scheduler state
const schedulerState = {
  isEnabled: true,
  lastRunAt: null,
  lastRunSummary: null,
  intervalTimer: null,
  intervalMs: 24 * 60 * 60 * 1000, // Every 24 hours (Daily)
  thresholdDays: 30, // 30-day window
  minDaysBetweenReminders: 7, // Throttling: Do not email same client more than once a week
};

/**
 * Core function to scan database and auto-dispatch due date reminders to customers
 */
export const runCalibrationDueReminderScan = async ({
  thresholdDays = schedulerState.thresholdDays,
  forceSend = false,
  customSubject = "",
  customMessage = "",
} = {}) => {
  try {
    const days = parseInt(thresholdDays, 10) || 30;
    const thresholdDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const minThrottleDate = new Date(
      Date.now() - schedulerState.minDaysBetweenReminders * 24 * 60 * 60 * 1000
    );

    // Find all calibration records due within the threshold window
    const query = {
      calibrationDueDate: { $lte: thresholdDate },
      autoReminderEnabled: { $ne: false },
    };

    const recordsDue = await CalibrationRecord.find(query).lean();

    if (!recordsDue || recordsDue.length === 0) {
      const summary = {
        totalDue: 0,
        eligibleCount: 0,
        clientsNotified: 0,
        dispatchedRecords: 0,
        timestamp: new Date().toISOString(),
        message: `Automated scan completed: No instruments due for calibration within ${days} days.`,
      };
      schedulerState.lastRunAt = new Date();
      schedulerState.lastRunSummary = summary;
      return summary;
    }

    // Filter instruments: Throttle to once every 7 days unless forceSend is requested
    const eligibleRecords = recordsDue.filter((rec) => {
      if (forceSend) return true;
      if (!rec.lastReminderSentAt) return true;
      return new Date(rec.lastReminderSentAt) <= minThrottleDate;
    });

    if (eligibleRecords.length === 0) {
      const summary = {
        totalDue: recordsDue.length,
        eligibleCount: 0,
        clientsNotified: 0,
        dispatchedRecords: 0,
        timestamp: new Date().toISOString(),
        message: `All ${recordsDue.length} due instruments already received reminders in the past 7 days (Throttled).`,
      };
      schedulerState.lastRunAt = new Date();
      schedulerState.lastRunSummary = summary;
      return summary;
    }

    // Group eligible instruments by client email / company
    const grouped = {};
    eligibleRecords.forEach((rec) => {
      const emailKey = (rec.clientEmail || "").trim().toLowerCase();
      const companyKey = (rec.clientCompany || "Default Client").trim();
      const key = emailKey || companyKey;

      if (!grouped[key]) {
        grouped[key] = {
          email: rec.clientEmail || "arclinstruments@gmail.com",
          company: rec.clientCompany || "Valued Client",
          contactPerson: rec.clientContactPerson || "Quality Assurance Manager",
          phone: rec.clientPhone || "+91 8009559900",
          recordIds: [],
          instruments: [],
        };
      }

      grouped[key].recordIds.push(rec._id);
      grouped[key].instruments.push(rec);
    });

    const dispatchResults = [];

    for (const key of Object.keys(grouped)) {
      const group = grouped[key];
      try {
        await sendCalibrationDueEmail({
          toEmail: group.email,
          clientCompany: group.company,
          contactPerson: group.contactPerson,
          instruments: group.instruments,
          customSubject: customSubject || undefined,
          customMessage: customMessage || undefined,
          labContactPhone: group.phone,
        });

        // Update database records timestamp and reminder count
        await CalibrationRecord.updateMany(
          { _id: { $in: group.recordIds } },
          {
            $set: { lastReminderSentAt: new Date() },
            $inc: { reminderCount: 1 },
          }
        );

        dispatchResults.push({
          company: group.company,
          email: group.email,
          instrumentsCount: group.instruments.length,
          status: "Dispatched",
        });

        console.log(
          `[AutoReminder Cron] 📧 Sent calibration due reminder to ${group.company} (${group.email}) for ${group.instruments.length} instrument(s).`
        );
      } catch (err) {
        console.error(
          `[AutoReminder Cron] ⚠️ Failed sending reminder to ${group.email}:`,
          err.message
        );
        dispatchResults.push({
          company: group.company,
          email: group.email,
          instrumentsCount: group.instruments.length,
          status: `Failed: ${err.message}`,
        });
      }
    }

    const summary = {
      totalDue: recordsDue.length,
      eligibleCount: eligibleRecords.length,
      clientsNotified: dispatchResults.filter((d) => d.status === "Dispatched").length,
      dispatchedRecords: eligibleRecords.length,
      batchDetails: dispatchResults,
      timestamp: new Date().toISOString(),
      message: `Successfully auto-dispatched due reminders to ${
        dispatchResults.filter((d) => d.status === "Dispatched").length
      } clients (${eligibleRecords.length} instruments).`,
    };

    schedulerState.lastRunAt = new Date();
    schedulerState.lastRunSummary = summary;
    return summary;
  } catch (error) {
    console.error("[AutoReminder Scheduler Error]:", error);
    throw error;
  }
};

/**
 * Start Background Daily Scheduler
 */
export const startCalibrationReminderScheduler = () => {
  if (schedulerState.intervalTimer) {
    clearInterval(schedulerState.intervalTimer);
  }

  schedulerState.isEnabled = true;
  console.log(
    "⏰ [ARCL Cron] Automated Calibration Due Reminder Scheduler activated (Daily 24h cycle, 30-day window)."
  );

  // Initial non-blocking check after server boots up (10 seconds)
  setTimeout(() => {
    if (schedulerState.isEnabled) {
      console.log("🔍 [ARCL Cron] Running initial startup calibration due scan...");
      runCalibrationDueReminderScan({ thresholdDays: 30 }).catch((err) => {
        console.error("Initial AutoReminder scan error:", err.message);
      });
    }
  }, 10000);

  // Set recurring 24-hour interval
  schedulerState.intervalTimer = setInterval(() => {
    if (schedulerState.isEnabled) {
      console.log("⏰ [ARCL Cron] Triggering scheduled daily calibration due scan...");
      runCalibrationDueReminderScan({ thresholdDays: 30 }).catch((err) => {
        console.error("Scheduled AutoReminder scan error:", err.message);
      });
    }
  }, schedulerState.intervalMs);
};

/**
 * Get current scheduler status
 */
export const getSchedulerStatus = () => {
  return {
    isEnabled: schedulerState.isEnabled,
    intervalHours: schedulerState.intervalMs / (1000 * 60 * 60),
    thresholdDays: schedulerState.thresholdDays,
    minDaysBetweenReminders: schedulerState.minDaysBetweenReminders,
    lastRunAt: schedulerState.lastRunAt,
    lastRunSummary: schedulerState.lastRunSummary,
    nextRunApprox: schedulerState.lastRunAt
      ? new Date(schedulerState.lastRunAt.getTime() + schedulerState.intervalMs).toISOString()
      : "Within next 24 hours",
  };
};

/**
 * Toggle scheduler enabled/disabled state
 */
export const toggleScheduler = (enabled) => {
  schedulerState.isEnabled = typeof enabled === "boolean" ? enabled : !schedulerState.isEnabled;
  return getSchedulerStatus();
};
