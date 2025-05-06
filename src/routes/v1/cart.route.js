const express = require('express');
const router = express.Router();

const cartController = require('#controllers/cartController');

const { verifyTokenCustomer } = require('#middlewares/auth.middleware');

router.get('/:idCustomer', verifyTokenCustomer, cartController.getCartItems);

router.post('/:idCustomer', verifyTokenCustomer, cartController.addToCart);

// router.put("/:idCustomer", verifyTokenCustomer, cartController.updateCart);

router.put('/reset/:idCustomer', verifyTokenCustomer, cartController.resetCart);

module.exports = router;
