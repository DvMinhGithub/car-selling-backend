const express = require('express');
const router = express.Router();

const carController = require('#controllers/carController');

const uploadFile = require('#middlewares/upload.middleware');
const {
  verifyTokenCustomer,
  verifyTokenAdmin,
  verifyTokenAllRole,
} = require('#middlewares/auth.middleware');

router.get('/', verifyTokenCustomer, carController.getAllCar);
router.get('/detail', verifyTokenAllRole, carController.getCarDetail);

router.post('/', verifyTokenAdmin, carController.createCar);

router.put('/', verifyTokenAdmin, uploadFile('images'), carController.updateCar);

module.exports = router;
