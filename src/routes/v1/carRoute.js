const express = require("express");
const router = express.Router();

const carController = require("../../controllers/carController");

router.get("/", carController.getAllCar);
router.get("/:id", carController.getCarDetail);

router.post("/", carController.createCar);

router.put("/", carController.updateCar);

module.exports = router;
