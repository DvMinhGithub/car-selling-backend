const express = require('express');
const router = express.Router();

const {
  verifyTokenAdmin,
  verifyTokenAllRole,
  verifyTokenCustomer,
} = require('#middlewares/auth.middleware');

const billController = require('#controllers/billController');

router.get('/me', verifyTokenCustomer, billController.getMyBills);
router.post('/me', verifyTokenCustomer, billController.createMyBill);
router.patch('/me/:id/cancel', verifyTokenCustomer, billController.cancelMyBill);

router.get('/detail/:id', verifyTokenAllRole, billController.getBillDetail);
router.get('/', verifyTokenAdmin, billController.getAllBill);
router.patch('/:id/status', verifyTokenAdmin, billController.updateBillStatus);

router.get('/:idCustomer', verifyTokenAllRole, billController.getAllBill);

router.post('/:idCustomer', verifyTokenAllRole, billController.createBill);

module.exports = router;
