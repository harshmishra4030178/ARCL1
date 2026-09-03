import express from "express";
import {
  getEquipmentTypes,
  getEquipmentType,
} from "../../controllers/client/equipmentTypeControllers.js";

const router = express.Router();

router.get("/", getEquipmentTypes);
router.get("/:slug", getEquipmentType);

export default router;