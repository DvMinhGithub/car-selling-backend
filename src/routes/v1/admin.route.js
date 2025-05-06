const express = require('express');
const router = express.Router();

const adminController = require('#controllers/adminController');

const { verifyTokenAdmin } = require('#middlewares/auth.middleware');
const uploadFile = require('#middlewares/upload.middleware');

router.post('/', adminController.createAdminAcc);

router.put('/:id', verifyTokenAdmin, uploadFile, adminController.updateAdmin);

router.post('/login', adminController.login);

router.post('/refreshToken', adminController.refreshToken);

router.post('/logout', adminController.logOut);

module.exports = router;
