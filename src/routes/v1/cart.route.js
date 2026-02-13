const express = require('express');
const router = express.Router();

const cartController = require('#controllers/cartController');

const { verifyTokenCustomer } = require('#middlewares/auth.middleware');

router.get('/me', verifyTokenCustomer, cartController.getMyCart);
router.post('/me/items', verifyTokenCustomer, cartController.addToMyCart);
router.put('/me/items/:carId', verifyTokenCustomer, cartController.updateCartItem);
router.delete('/me/items/:carId', verifyTokenCustomer, cartController.removeCartItem);
router.put('/me/reset', verifyTokenCustomer, cartController.resetMyCart);

router.get('/:idCustomer', verifyTokenCustomer, cartController.getCartItems);

router.post('/:idCustomer', verifyTokenCustomer, cartController.addToCart);

router.put('/reset/:idCustomer', verifyTokenCustomer, cartController.resetCart);

module.exports = router;
