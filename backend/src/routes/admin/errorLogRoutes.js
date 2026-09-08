import express from "express";
import {
  getErrorLogs,
  getErrorStats,
  toggleResolveErrorLog,
  deleteErrorLog,
  clearResolvedErrorLogs,
} from "../../controllers/admin/errorLogControllers.js";
import { verifyAdmin } from "../../middlewares/authMiddleware.js";

const router = express.Router();

router.use(verifyAdmin);

router.get("/", getErrorLogs);
router.get("/stats", getErrorStats);
router.patch("/:id/resolve", toggleResolveErrorLog);
router.delete("/:id", deleteErrorLog);
router.delete("/actions/clear-resolved", clearResolvedErrorLogs);

export default router;
