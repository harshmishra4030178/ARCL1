import express from "express";
import cors from "cors";
import { API_VERSION } from "./constants.js";
import { verifyAdmin, verifyUserManageAccess, checkModulePermission } from "./middlewares/authMiddleware.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import ApiError from "./utils/ApiError.js";
import ApiResponse from "./utils/ApiResponse.js";

// ================= AUTH ROUTES =================
import authRoutes from "./routes/authRoutes.js";

// ================= ADMIN ROUTES =================
import adminCategoryRoutes from "./routes/admin/categoryRoutes.js";
import adminEquipmentTypeRoutes from "./routes/admin/equipmentTypeRoutes.js";
import adminProductRoutes from "./routes/admin/productRoutes.js";
import adminInquiryRoutes from "./routes/admin/inquiryRoutes.js";
import adminContactRoutes from "./routes/admin/contactRoutes.js";
import adminSubscriberRoutes from "./routes/admin/subscriberRoutes.js";
import adminUserRoutes from "./routes/admin/userRoutes.js";
import adminAnalyticsRoutes from "./routes/admin/analyticsRoutes.js";
import adminBlogRoutes from "./routes/admin/blogRoutes.js";
import adminErrorLogRoutes from "./routes/admin/errorLogRoutes.js";

// ================= CLIENT ROUTES =================
import clientCategoryRoutes from "./routes/client/categoryRoutes.js";
import clientEquipmentTypeRoutes from "./routes/client/equipmentTypeRoutes.js";
import clientProductRoutes from "./routes/client/productRoutes.js";
import clientInquiryRoutes from "./routes/client/inquiryRoutes.js";
import clientContactRoutes from "./routes/client/contactRoutes.js";
import clientSubscriberRoutes from "./routes/client/subscriberRoutes.js";
import clientAnalyticsRoutes from "./routes/client/analyticsRoutes.js";
import clientBlogRoutes from "./routes/client/blogRoutes.js";
import clientErrorLogRoutes from "./routes/client/errorLogRoutes.js";

const app = express();

// Global Middlewares
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static("public"));
// Dynamic & Robust CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests (e.g. mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    const envOrigins = (process.env.CORS_ORIGIN || "")
      .split(",")
      .map((o) => o.trim())
      .filter(Boolean);

    const isAllowed =
      envOrigins.includes(origin) ||
      origin.includes("localhost") ||
      origin.includes("127.0.0.1") ||
      origin.endsWith(".vercel.app") ||
      origin.includes("arcl") ||
      origin.includes("render.com");

    if (isAllowed) {
      return callback(null, true);
    }

    // Default fallback: allow origin
    return callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cache-Control",
    "Pragma",
    "Expires",
  ],
  exposedHeaders: ["Content-Range", "X-Content-Range"],
  maxAge: 86400,
};

app.use(cors(corsOptions));

// Health Check API
app.get(`${API_VERSION}/health`, (req, res) => {
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { status: "healthy", timestamp: new Date().toISOString() },
        "ARCL Server is running smoothly"
      )
    );
});

// ================= ROUTE REGISTRATIONS =================
const AUTH_API = `${API_VERSION}/auth`;
const ADMIN_API = `${API_VERSION}/admin`;
const CLIENT_API = `${API_VERSION}/client`;

// Auth APIs
app.use(`${AUTH_API}`, authRoutes);

// Admin APIs (Protected via JWT, Role Verification & Granular RBAC)
app.use(`${ADMIN_API}/categories`, verifyAdmin, checkModulePermission("categories"), adminCategoryRoutes);
app.use(`${ADMIN_API}/equipment-types`, verifyAdmin, checkModulePermission("equipmentTypes"), adminEquipmentTypeRoutes);
app.use(`${ADMIN_API}/products`, verifyAdmin, checkModulePermission("products"), adminProductRoutes);
app.use(`${ADMIN_API}/inquiries`, verifyAdmin, checkModulePermission("inquiries"), adminInquiryRoutes);
app.use(`${ADMIN_API}/contacts`, verifyAdmin, checkModulePermission("contacts"), adminContactRoutes);
app.use(`${ADMIN_API}/subscribers`, verifyAdmin, checkModulePermission("subscribers"), adminSubscriberRoutes);
app.use(`${ADMIN_API}/users`, verifyAdmin, verifyUserManageAccess, adminUserRoutes);
app.use(`${ADMIN_API}/analytics`, verifyAdmin, adminAnalyticsRoutes);
app.use(`${ADMIN_API}/blogs`, verifyAdmin, checkModulePermission("blogs"), adminBlogRoutes);
app.use(`${ADMIN_API}/error-logs`, verifyAdmin, adminErrorLogRoutes);

// Client APIs (Public Storefront)
app.use(`${CLIENT_API}/categories`, clientCategoryRoutes);
app.use(`${CLIENT_API}/equipment-types`, clientEquipmentTypeRoutes);
app.use(`${CLIENT_API}/products`, clientProductRoutes);
app.use(`${CLIENT_API}/inquiries`, clientInquiryRoutes);
app.use(`${CLIENT_API}/contacts`, clientContactRoutes);
app.use(`${CLIENT_API}/subscribers`, clientSubscriberRoutes);
app.use(`${CLIENT_API}/analytics`, clientAnalyticsRoutes);
app.use(`${CLIENT_API}/blogs`, clientBlogRoutes);
app.use(`${CLIENT_API}/error-logs`, clientErrorLogRoutes);

// Root Welcome Endpoint
app.get("/", (req, res) => {
  res.json(
    new ApiResponse(
      200,
      { version: "1.0.0", docs: `${API_VERSION}/health` },
      "Welcome to ARCL Instruments Enterprise REST API"
    )
  );
});

// 404 Handler for undefined routes
app.use((req, res, next) => {
  next(new ApiError(404, `Route not found on this server: ${req.originalUrl}`));
});

// Centralized Global Error Handler Middleware
app.use(errorHandler);

export default app;