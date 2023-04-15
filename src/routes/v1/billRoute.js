const express = require("express");
const router = express.Router();

const billController = require("../../controllers/billController");

router.get("/", billController.getAllBill);
router.get("/:id", billController.getBillDetail);

router.post("/", billController.createBill);

module.exports = router;
