const express = require('express');
const router = express.Router();

const carController = require('#controllers/carController');

const uploadFile = require('#middlewares/upload.middleware');
const { verifyTokenAdmin, verifyTokenCustomer } = require('#middlewares/auth.middleware');

router.get('/', carController.getAllCar);
router.get('/detail', carController.getCarDetail);
router.get('/:id/reviews', carController.getCarReviews);
router.post('/:id/reviews', verifyTokenCustomer, carController.createCarReview);
router.put('/:id/reviews/:reviewId', verifyTokenCustomer, carController.updateCarReview);
router.delete('/:id/reviews/:reviewId', verifyTokenCustomer, carController.deleteCarReview);
router.get('/:id', carController.getCarById);

router.post('/', verifyTokenAdmin, uploadFile('image'), carController.createCar);

router.put('/:id', verifyTokenAdmin, uploadFile('image'), carController.updateCar);
router.put('/', verifyTokenAdmin, uploadFile('image'), carController.updateCar);
router.delete('/:id', verifyTokenAdmin, carController.deleteCar);

module.exports = router;
