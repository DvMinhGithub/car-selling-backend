const express = require('express');
const router = express.Router();

const { verifyTokenCustomer } = require('#middlewares/auth.middleware');
const uploadFile = require('#middlewares/upload.middleware');

const customerController = require('#controllers/customerController');

router.post('/register', customerController.register);

router.put('/:id', verifyTokenCustomer, uploadFile('image'), customerController.updateCustomer);

router.post('/login', customerController.login);

router.post('/refreshToken', customerController.refreshToken);

router.post('/logout', customerController.logout);

module.exports = router;
