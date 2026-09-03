import express from "express";
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

router.post("/", createEquipmentType);
router.get("/", getAllEquipmentTypes);
router.put("/reorder", reorderEquipmentTypes);
router.get("/:id", getSingleEquipmentType);
router.put("/:id", updateEquipmentType);
router.patch("/:id/toggle", toggleEquipmentTypeStatus);
router.patch("/:id/toggle-featured", toggleEquipmentTypeFeatured);
router.delete("/:id", deleteEquipmentType);

export default router;