import express from "express";
import { createContact } from "../../controllers/client/contactControllers.js";

const router = express.Router();

router.post("/", createContact);

export default router;