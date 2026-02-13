const express = require('express');
const router = express.Router();

const adminController = require('#controllers/adminController');

const { verifyTokenAdmin } = require('#middlewares/auth.middleware');
const uploadFile = require('#middlewares/upload.middleware');

router.post('/', adminController.createAdminAcc);

router.post('/login', adminController.login);

router.post('/refreshToken', adminController.refreshToken);

router.post('/logout', adminController.logOut);
router.get('/me', verifyTokenAdmin, adminController.getMe);

router.put('/:id', verifyTokenAdmin, uploadFile('image'), adminController.updateAdmin);

module.exports = router;
