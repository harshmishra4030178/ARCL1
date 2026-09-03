import express from "express";
import {
  deleteContact,
  getAllContacts,
  getSingleContact,
  updateContactStatus,
} from "../../controllers/admin/contactControllers.js";

const router = express.Router();

router.get("/", getAllContacts);
router.get("/:id", getSingleContact);
router.put("/:id", updateContactStatus);
router.delete("/:id", deleteContact);

export default router;