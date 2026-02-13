const express = require('express');
const router = express.Router();

const {
  verifyTokenAdmin,
  verifyTokenAllRole,
  verifyTokenCustomer,
} = require('#middlewares/auth.middleware');
const uploadFile = require('#middlewares/upload.middleware');

const customerController = require('#controllers/customerController');

router.post('/register', customerController.register);
router.post('/login', customerController.login);

router.post('/refreshToken', customerController.refreshToken);

router.post('/logout', customerController.logout);
router.get('/me', verifyTokenCustomer, customerController.getMe);
router.put('/me', verifyTokenCustomer, uploadFile('image'), customerController.updateCustomer);
router.put('/me/change-password', verifyTokenCustomer, customerController.changePassword);
router.get('/me/addresses', verifyTokenCustomer, customerController.getMyAddresses);
router.post('/me/addresses', verifyTokenCustomer, customerController.addMyAddress);
router.put('/me/addresses/:addressId', verifyTokenCustomer, customerController.updateMyAddress);
router.delete('/me/addresses/:addressId', verifyTokenCustomer, customerController.deleteMyAddress);
router.patch(
  '/me/addresses/:addressId/default',
  verifyTokenCustomer,
  customerController.setDefaultAddress,
);

router.get('/', verifyTokenAdmin, customerController.getAllCustomers);
router.get('/:id', verifyTokenAdmin, customerController.getCustomerById);
router.put('/:id', verifyTokenAllRole, uploadFile('image'), customerController.updateCustomer);

module.exports = router;
