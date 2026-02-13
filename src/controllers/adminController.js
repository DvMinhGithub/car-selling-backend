const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const adminModel = require('#models/admin');
const { APP, COOKIE, HTTP_STATUS, JWT, ROLES } = require('#configs/constants');
const {
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  hashPassword,
  verifyRefreshToken,
} = require('#utils/helpers');

const baseRefreshCookieOptions = {
  httpOnly: COOKIE.HTTP_ONLY,
  secure: COOKIE.SECURE,
  path: COOKIE.PATH,
  sameSite: COOKIE.SAME_SITE,
};

const getRefreshCookieOptions = (remember) =>
  remember
    ? { ...baseRefreshCookieOptions, maxAge: JWT.COOKIE_EXPIRES_IN }
    : baseRefreshCookieOptions;

const toAuthPayload = (admin) => ({
  _id: admin._id.toString(),
  userName: admin.userName,
  email: admin.email,
  role: admin.role || ROLES.ADMIN,
});

const resolveBaseUrl = (req) => APP.BASE_URL || `${req.protocol}://${req.get('host')}`;

const resolveStoredPath = (fileUrl) => {
  try {
    return new URL(fileUrl).pathname.replace(/^\/+/, '');
  } catch {
    return String(fileUrl)
      .replace(/^https?:\/\/[^/]+\/?/, '')
      .replace(/^\/+/, '');
  }
};

const toPublicAdmin = (admin) => {
  if (!admin) return null;
  const adminObj = admin.toObject ? admin.toObject() : admin;
  delete adminObj.password;
  return adminObj;
};

const clearRefreshCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: COOKIE.HTTP_ONLY,
    secure: COOKIE.SECURE,
    path: COOKIE.PATH,
    sameSite: COOKIE.SAME_SITE,
  });
};

const adminController = {
  createAdminAcc: async (req, res) => {
    try {
      const { userName, email, password } = req.body;
      if (!userName || !email || !password) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Vui lòng nhập userName, email và password',
        });
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const existed = await adminModel.findOne({ email: normalizedEmail });
      if (existed) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          message: 'Email đã tồn tại',
        });
      }

      const passwordHashed = await hashPassword(password);
      const adminCreated = await adminModel.create({
        userName,
        email: normalizedEmail,
        password: passwordHashed,
        role: ROLES.ADMIN,
      });

      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Tạo tài khoản admin thành công',
        data: toPublicAdmin(adminCreated),
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  getMe: async (req, res) => {
    try {
      const admin = await adminModel.findById(req.user?._id).select('-password');
      if (!admin) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy admin',
        });
      }
      return res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Lấy thông tin admin thành công',
        data: admin,
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  updateAdmin: async (req, res) => {
    try {
      const id = req.params.id || req.user?._id;
      if (req.user?.role !== ROLES.ADMIN) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Bạn không có quyền cập nhật admin',
        });
      }

      const currentAdmin = await adminModel.findById(id);
      if (!currentAdmin) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy admin',
        });
      }

      const updateData = { ...req.body };

      if (updateData.email !== undefined) {
        const normalizedEmail = String(updateData.email).trim().toLowerCase();
        const duplicate = await adminModel.findOne({
          email: normalizedEmail,
          _id: { $ne: id },
        });
        if (duplicate) {
          return res.status(HTTP_STATUS.CONFLICT).json({
            success: false,
            message: 'Email đã tồn tại',
          });
        }
        updateData.email = normalizedEmail;
      }

      if (updateData.password !== undefined) {
        updateData.password = await hashPassword(String(updateData.password));
      }

      if (req.file) {
        const uploadPublicPath = APP.UPLOAD_PUBLIC_PATH.replace(/^\/+/, '');
        const baseUrl = resolveBaseUrl(req);
        const newAvatarUrl = `${baseUrl}/${uploadPublicPath}/${req.file.filename}`;
        updateData.avatar = newAvatarUrl;

        if (currentAdmin.avatar && currentAdmin.avatar !== newAvatarUrl) {
          const oldAvatarPath = path.join(
            process.cwd(),
            APP.STATIC_DIR,
            resolveStoredPath(currentAdmin.avatar).replace(/^public\/+/, ''),
          );
          if (fs.existsSync(oldAvatarPath)) fs.unlinkSync(oldAvatarPath);
        }
      }

      const updatedAdmin = await adminModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .select('-password');

      return res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Cập nhật admin thành công',
        data: updatedAdmin,
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password, remember } = req.body;
      if (!email || !password) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Vui lòng nhập email và password',
        });
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const user = await adminModel.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Email hoặc mật khẩu không đúng',
        });
      }

      const checkPassword = await comparePassword(password, user.password);
      if (!checkPassword) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Email hoặc mật khẩu không đúng',
        });
      }

      const authPayload = toAuthPayload(user);
      const accessToken = generateAccessToken(authPayload);
      const rememberSession = Boolean(remember);
      const refreshToken = generateRefreshToken({ ...authPayload, remember: rememberSession });

      user.refreshToken = refreshToken;
      await user.save();

      res.cookie('refreshToken', refreshToken, getRefreshCookieOptions(rememberSession));
      return res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Đăng nhập admin thành công',
        accessToken,
        refreshToken,
        data: toPublicAdmin(user),
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
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
          message: 'Thiếu refresh token',
        });
      }

      const decoded = verifyRefreshToken(refreshToken);
      const rememberSession = decoded?.remember !== undefined ? Boolean(decoded.remember) : true;
      const user = await adminModel.findById(decoded._id);
      if (!user || user.refreshToken !== refreshToken) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Refresh token không hợp lệ',
        });
      }

      const authPayload = toAuthPayload(user);
      const newAccessToken = generateAccessToken(authPayload);
      const newRefreshToken = generateRefreshToken({ ...authPayload, remember: rememberSession });

      user.refreshToken = newRefreshToken;
      await user.save();

      res.cookie('refreshToken', newRefreshToken, getRefreshCookieOptions(rememberSession));
      return res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Làm mới token thành công',
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Refresh token không hợp lệ',
        });
      }
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  logOut: async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      const userId = req.user?._id;

      if (refreshToken) {
        await adminModel.findOneAndUpdate({ refreshToken }, { $set: { refreshToken: null } });
      } else if (userId) {
        await adminModel.findByIdAndUpdate(userId, { $set: { refreshToken: null } });
      }

      clearRefreshCookie(res);

      return res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Đăng xuất thành công',
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = adminController;
