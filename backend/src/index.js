import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dns from "node:dns";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config(); // fallback to root .env if present

// Fix DNS timeout issues on restrictive networks/ISPs
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {
  console.warn("DNS server setup notice:", e.message);
}

import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 5000;

// Standalone Server mode (Local development / Traditional VPS)
if (process.env.VERCEL !== "1" && !process.env.AWS_LAMBDA_FUNCTION_NAME) {
  connectDB()
    .then(() => {
      const server = app.listen(PORT, () => {
        console.log(`=========================================`);
        console.log(`🚀 ARCL Server running on port ${PORT}`);
        console.log(`📡 Health Check: http://localhost:${PORT}/api/v1/health`);
        console.log(`=========================================`);
      });

      process.on("unhandledRejection", (err) => {
        console.error("UNHANDLED REJECTION! Shutting down gracefully...", err);
        server.close(() => process.exit(1));
      });

      process.on("uncaughtException", (err) => {
        console.error("UNCAUGHT EXCEPTION! Shutting down...", err);
        process.exit(1);
      });
    })
    .catch((error) => {
      console.error("MongoDB Connection Failed! ", error.message);
    });
}

// Vercel Serverless Function Handler
export default async function handler(req, res) {
  try {
    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error("Serverless Handler Error:", error);
    return res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
}

export { app };