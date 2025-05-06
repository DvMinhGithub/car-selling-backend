const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const adminModel = require('#models/admin');
const { generateToken, comparePassword } = require('#utils/helpers');

let arrRefreshToken = [];

const adminController = {
  createAdminAcc: async (req, res) => {
    try {
      const { userName, email, password } = req.body;
      const checkEmail = await adminModel.findOne({ email });

      if (checkEmail) {
        return res.status(404).json({ success: false, message: 'Tên đăng nhập tồn tại' });
      } else {
        const hashPassword = hashPassword(password);
        await adminModel.create({ userName, email, password: hashPassword });
        return res.status(200).json({ success: true, message: 'Tạo tài khoản thành công' });
      }
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  updateAdmin: async (req, res) => {
    try {
      const { id } = req.params;
      const currentAdmin = await adminModel.findById(id).select('-password');
      const currentAvatarUrl = currentAdmin.avatar;

      const newAvatarUrl =
        req.file && `http://localhost:${process.env.PORT}/images/${req.file.filename}`;
      const updateData = { ...req.body };

      if (newAvatarUrl) {
        updateData.avatar = newAvatarUrl;

        if (currentAvatarUrl && currentAvatarUrl !== newAvatarUrl) {
          const oldAvatarPath = path.join(
            __dirname,
            '../../public',
            currentAvatarUrl.replace(`http://localhost:${process.env.PORT}`, ''),
          );
          if (fs.existsSync(oldAvatarPath)) fs.unlinkSync(oldAvatarPath);
        }
      }

      const updatedAdmin = await adminModel.findByIdAndUpdate(id, updateData, {
        new: true,
      });

      res.status(200).json({
        success: true,
        message: 'Cập nhật thành công',
        data: updatedAdmin,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await adminModel.findOne({ email });
      if (!user) {
        return res.status(404).json({ success: false, message: 'Tên đăng nhập không tồn tại' });
      }
      const checkPassword = comparePassword(password, user.password);
      if (!checkPassword) {
        return res.status(404).json({ success: false, message: 'Mật khẩu không đúng' });
      }
      const token = generateToken(user);
      const refreshToken = generateToken(user);
      arrRefreshToken.push(refreshToken);
      const userData = await adminModel.findById(user._id).select('-password');

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: false,
        path: '/',
        sameSite: 'strict',
      });
      return res.status(200).json({ success: true, token, user: userData });
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  },

  refreshToken: async (req, res) => {
    try {
      const refreshToken = req.cookie.refreshToken;

      if (!refreshToken) {
        return res.status(404).json({ success: false, message: 'Bạn không có quyền truy cập' });
      }
      if (!arrRefreshToken.includes(refreshToken)) {
        return res.status(404).json({ success: false, message: 'Bạn không có quyền truy cập' });
      }
      jwt.verify(refreshToken, process.env.REFRESH_TOKEN, (err, data, next) => {
        if (err) {
          next(err);
        }
        arrRefreshToken = arrRefreshToken.filter((token) => token !== refreshToken);
        const newAccessToken = generateToken(data);
        const newRefreshToken = generateToken(data);

        arrRefreshToken.push(newRefreshToken);
        res.cookie('refreshToken', newRefreshToken, {
          httpOnly: true,
          secure: false,
          path: '/',
          sameSite: 'strict',
        });
        res.status(200).json({
          success: true,
          data: [
            {
              accessToken: newAccessToken,
              refreshToken: newRefreshToken,
            },
          ],
        });
      });
    } catch (error) {
      res.send(error);
    }
  },
  logOut: async (req, res, next) => {
    try {
      const refreshToken = req.cookies.refreshToken;

      arrRefreshToken = arrRefreshToken.filter((token) => token !== refreshToken);
      res.clearCookie('refreshToken');
      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = adminController;
