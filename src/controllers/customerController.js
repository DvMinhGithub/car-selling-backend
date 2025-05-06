const customerModel = require('../models/customer');
const bcrypt = require('bcrypt');
const fs = require('fs');
const cartModel = require('../models/cart');
const path = require('path');
const jwt = require('jsonwebtoken');
const { generateToken, verifyToken } = require('../utils/helpers');
const { HTTP_STATUS } = require('../configs/constants');
const constants = require('../configs/constants');

const customerController = {
  register: async (req, res) => {
    try {
      const { userName, phoneNumber, email, address, password } = req.body;

      const existingCustomer = await customerModel.findOne({ email });
      if (existingCustomer) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Email đã tồn tại',
        });
      }

      const saltRounds = 10;
      const hashPassword = await bcrypt.hash(password, saltRounds);

      const customerAcc = await customerModel.create({
        userName,
        email,
        phoneNumber,
        address,
        password: hashPassword,
      });

      await cartModel.create({ idCustomer: customerAcc._id });

      const customerResponse = customerAcc.toObject();
      delete customerResponse.password;

      return res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Đăng ký thành công',
        data: customerResponse,
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  updateCustomer: async (req, res) => {
    try {
      const { id } = req.params;
      console.log(req.file);

      const currentCustomer = await customerModel.findById(id);
      if (!currentCustomer) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy khách hàng',
        });
      }

      let newAvatarUrl;
      if (req.file) {
        newAvatarUrl = `${req.protocol}://${req.get('host')}/images/${req.file.filename}`;

        if (currentCustomer.avatar) {
          try {
            const oldAvatarPath = path.join(
              __dirname,
              '../../public',
              new URL(currentCustomer.avatar).pathname,
            );
            await fs.unlink(oldAvatarPath);
          } catch (err) {
            console.error('Error deleting old avatar:', err);
          }
        }
      }

      const updateData = { ...req.body };
      if (newAvatarUrl) updateData.avatar = newAvatarUrl;

      const updatedCustomer = await customerModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true },
      );

      res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Cập nhật thành công',
        data: updatedCustomer,
      });
    } catch (error) {
      console.error('Update error:', error);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await customerModel.findOne({ email });
      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
        });
      }

      const userData = {
        _id: user._id,
        userName: user.userName,
        email: user.email,
        role: user.role,
      };

      const accessToken = generateToken(userData);
      const refreshToken = generateToken(userData);

      user.refreshToken = refreshToken;
      await user.save();

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: constants.COOKIE_EXPIRES_IN,
      });

      return res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        userData,
        accessToken,
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  refreshToken: async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      if (!refreshToken) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Yêu cầu xác thực',
        });
      }

      const decoded = verifyToken(refreshToken);

      const user = await customerModel.findById(decoded._id);
      if (!user || user.refreshToken !== refreshToken) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Phiên đăng nhập không hợp lệ',
        });
      }

      const userData = {
        _id: user._id,
        userName: user.userName,
        email: user.email,
        role: user.role,
      };

      const newAccessToken = generateToken(userData);
      const newRefreshToken = generateToken(userData);

      user.refreshToken = newRefreshToken;
      await user.save();

      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: constants.COOKIE_EXPIRES_IN,
      });

      res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        accessToken: newAccessToken,
      });
    } catch (error) {
      console.error('Refresh token error:', error);

      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Token không hợp lệ',
        });
      }

      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: 'Lỗi hệ thống',
      });
    }
  },

  logout: async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken;

      if (refreshToken) {
        await customerModel.findOneAndUpdate({ refreshToken }, { $set: { refreshToken: null } });
      }

      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Đăng xuất thành công',
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = customerController;
