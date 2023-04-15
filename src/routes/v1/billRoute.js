const express = require("express");
const router = express.Router();

const billController = require("../../controllers/billController");

router.get("/:idCustomer", billController.getAllBill);
router.get("/:id", billController.getBillDetail);

router.post("/:idCustomer", billController.createBill);

module.exports = router;
