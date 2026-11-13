import express from "express";
import {
  getOfficeSecuritySettings,
  updateOfficeSecuritySettings,
  whitelistCurrentIp,
  removeIpFromWhitelist,
} from "../../controllers/admin/officeSecurityController.js";

const router = express.Router();

router.get("/", getOfficeSecuritySettings);
router.put("/", updateOfficeSecuritySettings);
router.post("/whitelist-current-ip", whitelistCurrentIp);
router.delete("/whitelist-ip", removeIpFromWhitelist);

export default router;
