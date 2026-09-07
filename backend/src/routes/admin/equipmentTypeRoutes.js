import express from "express";
import { checkModulePermission } from "../../middlewares/authMiddleware.js";
import {
  createEquipmentType,
  deleteEquipmentType,
  getAllEquipmentTypes,
  getSingleEquipmentType,
  reorderEquipmentTypes,
  toggleEquipmentTypeFeatured,
  toggleEquipmentTypeStatus,
  updateEquipmentType,
} from "../../controllers/admin/equipmentTypeControllers.js";

const router = express.Router();

router.post("/", checkModulePermission("equipmentTypes", "create"), createEquipmentType);
router.get("/", getAllEquipmentTypes);
router.put("/reorder", checkModulePermission("equipmentTypes", "edit"), reorderEquipmentTypes);
router.get("/:id", getSingleEquipmentType);
router.put("/:id", checkModulePermission("equipmentTypes", "edit"), updateEquipmentType);
router.patch("/:id/toggle", checkModulePermission("equipmentTypes", "edit"), toggleEquipmentTypeStatus);
router.patch("/:id/toggle-featured", checkModulePermission("equipmentTypes", "edit"), toggleEquipmentTypeFeatured);
router.delete("/:id", checkModulePermission("equipmentTypes", "delete"), deleteEquipmentType);

export default router;