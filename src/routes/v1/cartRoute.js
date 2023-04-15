const express = require("express");
const router = express.Router();

const cartController = require("../../controllers/cartController");

router.put("/:idCustomer", cartController.updateCart);
router.put("/reset/:idCustomer", cartController.resetCart);

module.exports = router;
