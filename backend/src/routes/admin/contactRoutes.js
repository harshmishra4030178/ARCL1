import express from "express";
import { checkModulePermission } from "../../middlewares/authMiddleware.js";
import {
  deleteContact,
  getAllContacts,
  getSingleContact,
  updateContactStatus,
} from "../../controllers/admin/contactControllers.js";

const router = express.Router();

router.get("/", checkModulePermission("contacts", "view"), getAllContacts);
router.get("/:id", checkModulePermission("contacts", "view"), getSingleContact);
router.put("/:id", checkModulePermission("contacts", "view"), updateContactStatus);
router.delete("/:id", checkModulePermission("contacts", "delete"), deleteContact);

export default router;