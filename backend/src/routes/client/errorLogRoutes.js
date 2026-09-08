import express from "express";
import { logClientError } from "../../controllers/client/errorLogControllers.js";

const router = express.Router();

router.post("/", logClientError);

export default router;
