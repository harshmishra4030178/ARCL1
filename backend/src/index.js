import "dotenv/config";
import dns from "node:dns";

// Fix DNS timeout issues on restrictive networks/ISPs
try {
  dns.setServers(["8.8.8.8", "8.8.4.4", "1.1.1.1"]);
} catch (e) {
  console.warn("DNS server setup notice:", e.message);
}

import app from "./app.js";
import { connectDB } from "./config/db.js";

const PORT = process.env.PORT || 3000;

// Connect to MongoDB and start HTTP server
connectDB()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`=========================================`);
      console.log(`🚀 ARCL Server running on port ${PORT}`);
      console.log(`📡 Health Check: http://localhost:${PORT}/api/v1/health`);
      console.log(`=========================================`);
    });

    // Handle Unhandled Promise Rejections
    process.on("unhandledRejection", (err) => {
      console.error("UNHANDLED REJECTION! Shutting down gracefully...");
      console.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    // Handle Uncaught Exceptions
    process.on("uncaughtException", (err) => {
      console.error("UNCAUGHT EXCEPTION! Shutting down...");
      console.error(err.name, err.message);
      process.exit(1);
    });
  })
  .catch((error) => {
    console.error("MongoDB Connection Failed! ", error.message);
    process.exit(1);
  });