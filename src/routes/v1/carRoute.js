const express = require("express");
const router = express.Router();

const carController = require("../../controllers/carController");
const uploadFile = require("../../middlewares/upload");

router.get("/", carController.getAllCar);
router.get("/detail", carController.getCarDetail);

router.post("/", carController.createCar);

router.put("/", uploadFile('images'), carController.updateCar);

module.exports = router;
