import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dns from "node:dns";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

// Set public DNS to prevent Windows SRV lookup failures
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {
  // ignore
}

import app from "./app.js";
import { connectDB } from "./config/db.js";
import { startCalibrationReminderScheduler } from "./services/calibrationReminderScheduler.js";

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`=========================================`);
      console.log(`🚀 ARCL Express Server running on port ${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/v1/health`);
      console.log(`=========================================`);

      // Initialize automated daily calibration due reminder background scheduler
      startCalibrationReminderScheduler();
    });

    process.on("unhandledRejection", (err) => {
      console.error("UNHANDLED REJECTION (Non-fatal):", err?.message || err);
    });

    process.on("uncaughtException", (err) => {
      console.error("UNCAUGHT EXCEPTION (Non-fatal):", err?.message || err);
    });
  })
  .catch((error) => {
    console.error("MongoDB Connection Failed!", error.message);
    process.exit(1);
  });

export default app;