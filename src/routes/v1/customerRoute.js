const express = require("express");
const router = express.Router();

const customerController = require("../../controllers/customerController");
const uploadFile = require("../../middlewares/upload");

router.post("/", customerController.register);

router.put("/:id", uploadFile("image"), customerController.updateCustomer);

module.exports = router;
