const express = require("express");
const router = express.Router();

const adminController = require("../../controllers/adminController");
const uploadFile = require("../../middlewares/upload");

router.post("/", adminController.createAdminAcc);

router.put("/:id", uploadFile, adminController.updateAdmin);

module.exports = router;
