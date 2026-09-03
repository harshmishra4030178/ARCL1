import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dns from "node:dns";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {}

import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`=========================================`);
      console.log(`🚀 ARCL Express Server running on port ${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/v1/health`);
      console.log(`=========================================`);
    });

    process.on("unhandledRejection", (err) => {
      console.error("UNHANDLED REJECTION:", err);
      server.close(() => process.exit(1));
    });

    process.on("uncaughtException", (err) => {
      console.error("UNCAUGHT EXCEPTION:", err);
      process.exit(1);
    });
  })
  .catch((error) => {
    console.error("MongoDB Connection Failed!", error.message);
    process.exit(1);
  });

export default app;