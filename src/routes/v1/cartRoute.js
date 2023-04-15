const express = require("express");
const router = express.Router();

const cartController = require("../../controllers/cartController");

router.put("/:id", cartController.updateCart);
router.put("/reset/:id", cartController.resetCart);

module.exports = router;
