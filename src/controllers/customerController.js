const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const customerModel = require('#models/customer');
const cartModel = require('#models/cart');
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
  sameSite: COOKIE.SAME_SITE,
  path: COOKIE.PATH,
};

const getRefreshCookieOptions = (remember) =>
  remember
    ? { ...baseRefreshCookieOptions, maxAge: JWT.COOKIE_EXPIRES_IN }
    : baseRefreshCookieOptions;

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

const toPublicCustomer = (customer) => {
  if (!customer) return null;
  const customerObj = customer.toObject ? customer.toObject() : customer;
  delete customerObj.password;
  return customerObj;
};

const isSelf = (req, id) => String(req.user?._id) === String(id);

const buildAuthPayload = (user) => ({
  _id: user._id.toString(),
  userName: user.userName,
  email: user.email,
  role: user.role,
});

const normalizeAddressPayload = (payload) => ({
  isDefaultProvided: Object.prototype.hasOwnProperty.call(payload || {}, 'isDefault'),
  receiverName: String(payload?.receiverName || '').trim(),
  phoneNumber: String(payload?.phoneNumber || '').trim(),
  addressLine: String(payload?.addressLine || '').trim(),
  ward: String(payload?.ward || '').trim(),
  district: String(payload?.district || '').trim(),
  city: String(payload?.city || '').trim(),
  note: String(payload?.note || '').trim(),
  isDefault: Object.prototype.hasOwnProperty.call(payload || {}, 'isDefault')
    ? Boolean(payload?.isDefault)
    : undefined,
});

const validateAddressPayload = (payload) => {
  if (!payload.receiverName || !payload.phoneNumber || !payload.addressLine) {
    return 'Thiếu thông tin bắt buộc: receiverName, phoneNumber, addressLine';
  }
  return null;
};

const clearRefreshCookie = (res) => {
  res.clearCookie('refreshToken', {
    httpOnly: COOKIE.HTTP_ONLY,
    secure: COOKIE.SECURE,
    sameSite: COOKIE.SAME_SITE,
    path: COOKIE.PATH,
  });
};

const customerController = {
  register: async (req, res) => {
    try {
      const { userName, phoneNumber, email, address, password } = req.body;
      if (!userName || !email || !password) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Vui lòng nhập userName, email và password',
        });
      }

      const normalizedEmail = String(email).trim().toLowerCase();
      const existingCustomer = await customerModel.findOne({ email: normalizedEmail });
      if (existingCustomer) {
        return res.status(HTTP_STATUS.CONFLICT).json({
          success: false,
          message: 'Email đã tồn tại',
        });
      }

      const passwordHashed = await hashPassword(password);
      const customerAcc = await customerModel.create({
        userName,
        email: normalizedEmail,
        phoneNumber,
        address,
        password: passwordHashed,
      });

      const cartCreated = await cartModel.create({ idCustomer: customerAcc._id });
      customerAcc.idCart = cartCreated._id;
      await customerAcc.save();

      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Đăng ký thành công',
        data: toPublicCustomer(customerAcc),
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
      const customer = await customerModel.findById(req.user?._id).select('-password');
      if (!customer) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy khách hàng',
        });
      }

      return res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Lấy thông tin tài khoản thành công',
        data: customer,
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  getAllCustomers: async (req, res) => {
    try {
      const customers = await customerModel.find().select('-password');
      return res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Lấy danh sách khách hàng thành công',
        data: customers,
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  getCustomerById: async (req, res) => {
    try {
      const customer = await customerModel.findById(req.params.id).select('-password');
      if (!customer) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy khách hàng',
        });
      }
      return res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Lấy thông tin khách hàng thành công',
        data: customer,
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  updateCustomer: async (req, res) => {
    try {
      const id = req.params.id || req.user?._id;
      const isAdmin = req.user?.role === ROLES.ADMIN;

      if (!isAdmin && !isSelf(req, id)) {
        return res.status(HTTP_STATUS.FORBIDDEN).json({
          success: false,
          message: 'Bạn không có quyền cập nhật tài khoản này',
        });
      }

      const currentCustomer = await customerModel.findById(id);
      if (!currentCustomer) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy khách hàng',
        });
      }

      const updateData = { ...req.body };

      if (updateData.email !== undefined) {
        const normalizedEmail = String(updateData.email).trim().toLowerCase();
        const duplicated = await customerModel.findOne({
          email: normalizedEmail,
          _id: { $ne: id },
        });
        if (duplicated) {
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

        if (currentCustomer.avatar && currentCustomer.avatar !== newAvatarUrl) {
          const oldAvatarPath = path.join(
            process.cwd(),
            APP.STATIC_DIR,
            resolveStoredPath(currentCustomer.avatar).replace(/^public\/+/, ''),
          );
          if (fs.existsSync(oldAvatarPath)) fs.unlinkSync(oldAvatarPath);
        }
      }

      const updatedCustomer = await customerModel
        .findByIdAndUpdate(id, { $set: updateData }, { new: true })
        .select('-password');

      return res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Cập nhật thành công',
        data: updatedCustomer,
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  changePassword: async (req, res) => {
    try {
      const userId = req.user?._id;
      const { oldPassword, newPassword } = req.body;

      if (!oldPassword || !newPassword) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Vui lòng nhập oldPassword và newPassword',
        });
      }

      if (String(newPassword).length < 8) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Mật khẩu mới phải có ít nhất 8 ký tự',
        });
      }

      const customer = await customerModel.findById(userId);
      if (!customer) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy khách hàng',
        });
      }

      const isValidOldPassword = await comparePassword(oldPassword, customer.password);
      if (!isValidOldPassword) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Mật khẩu cũ không đúng',
        });
      }

      if (oldPassword === newPassword) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: 'Mật khẩu mới phải khác mật khẩu cũ',
        });
      }

      customer.password = await hashPassword(newPassword);
      customer.refreshToken = null;
      await customer.save();

      clearRefreshCookie(res);

      return res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Đổi mật khẩu thành công, vui lòng đăng nhập lại',
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  getMyAddresses: async (req, res) => {
    try {
      const customer = await customerModel
        .findById(req.user?._id)
        .select('addresses address phoneNumber userName');

      if (!customer) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy khách hàng',
        });
      }

      return res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Lấy danh sách địa chỉ thành công',
        data: customer.addresses || [],
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  addMyAddress: async (req, res) => {
    try {
      const payload = normalizeAddressPayload(req.body);
      const validateMessage = validateAddressPayload(payload);
      if (validateMessage) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: validateMessage,
        });
      }

      const customer = await customerModel.findById(req.user?._id);
      if (!customer) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy khách hàng',
        });
      }

      if (!Array.isArray(customer.addresses)) {
        customer.addresses = [];
      }

      if (payload.isDefault === true || customer.addresses.length === 0) {
        customer.addresses.forEach((item) => {
          item.isDefault = false;
        });
        payload.isDefault = true;
      }

      customer.addresses.push(payload);
      await customer.save();

      return res.status(HTTP_STATUS.CREATED).json({
        success: true,
        message: 'Thêm địa chỉ thành công',
        data: customer.addresses,
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  updateMyAddress: async (req, res) => {
    try {
      const { addressId } = req.params;
      const payload = normalizeAddressPayload(req.body);
      const customer = await customerModel.findById(req.user?._id);

      if (!customer) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy khách hàng',
        });
      }

      const targetAddress = customer.addresses.id(addressId);
      if (!targetAddress) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy địa chỉ',
        });
      }

      const nextAddress = {
        receiverName: payload.receiverName || targetAddress.receiverName,
        phoneNumber: payload.phoneNumber || targetAddress.phoneNumber,
        addressLine: payload.addressLine || targetAddress.addressLine,
        ward: payload.ward || targetAddress.ward,
        district: payload.district || targetAddress.district,
        city: payload.city || targetAddress.city,
        note: payload.note || targetAddress.note,
        isDefault: payload.isDefaultProvided === true ? payload.isDefault : targetAddress.isDefault,
      };

      const validateMessage = validateAddressPayload(nextAddress);
      if (validateMessage) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          message: validateMessage,
        });
      }

      if (payload.isDefault === true) {
        customer.addresses.forEach((item) => {
          item.isDefault = false;
        });
      }

      targetAddress.receiverName = nextAddress.receiverName;
      targetAddress.phoneNumber = nextAddress.phoneNumber;
      targetAddress.addressLine = nextAddress.addressLine;
      targetAddress.ward = nextAddress.ward;
      targetAddress.district = nextAddress.district;
      targetAddress.city = nextAddress.city;
      targetAddress.note = nextAddress.note;
      targetAddress.isDefault = nextAddress.isDefault;

      await customer.save();

      return res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Cập nhật địa chỉ thành công',
        data: customer.addresses,
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  deleteMyAddress: async (req, res) => {
    try {
      const { addressId } = req.params;
      const customer = await customerModel.findById(req.user?._id);

      if (!customer) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy khách hàng',
        });
      }

      const targetAddress = customer.addresses.id(addressId);
      if (!targetAddress) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy địa chỉ',
        });
      }

      const wasDefault = targetAddress.isDefault;
      targetAddress.deleteOne();

      if (wasDefault && customer.addresses.length > 0) {
        customer.addresses[0].isDefault = true;
      }

      await customer.save();

      return res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Xóa địa chỉ thành công',
        data: customer.addresses,
      });
    } catch (error) {
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  setDefaultAddress: async (req, res) => {
    try {
      const { addressId } = req.params;
      const customer = await customerModel.findById(req.user?._id);
      if (!customer) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy khách hàng',
        });
      }

      const targetAddress = customer.addresses.id(addressId);
      if (!targetAddress) {
        return res.status(HTTP_STATUS.NOT_FOUND).json({
          success: false,
          message: 'Không tìm thấy địa chỉ',
        });
      }

      customer.addresses.forEach((item) => {
        item.isDefault = false;
      });
      targetAddress.isDefault = true;

      await customer.save();

      return res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Đặt địa chỉ mặc định thành công',
        data: customer.addresses,
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
      const user = await customerModel.findOne({ email: normalizedEmail });
      if (!user) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Email hoặc mật khẩu không đúng',
        });
      }

      const isPasswordValid = await comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Email hoặc mật khẩu không đúng',
        });
      }

      const userData = buildAuthPayload(user);
      const accessToken = generateAccessToken(userData);
      const rememberSession = Boolean(remember);
      const refreshToken = generateRefreshToken({ ...userData, remember: rememberSession });
      user.refreshToken = refreshToken;
      await user.save();

      res.cookie('refreshToken', refreshToken, getRefreshCookieOptions(rememberSession));
      return res.status(HTTP_STATUS.SUCCESS).json({
        success: true,
        message: 'Đăng nhập thành công',
        accessToken,
        refreshToken,
        data: toPublicCustomer(user),
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
      const user = await customerModel.findById(decoded._id);
      if (!user || user.refreshToken !== refreshToken) {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          message: 'Phiên đăng nhập không hợp lệ',
        });
      }

      const userData = buildAuthPayload(user);
      const newAccessToken = generateAccessToken(userData);
      const newRefreshToken = generateRefreshToken({ ...userData, remember: rememberSession });
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
          message: 'Token không hợp lệ hoặc đã hết hạn',
        });
      }
      return res.status(HTTP_STATUS.INTERNAL_ERROR).json({
        success: false,
        message: error.message,
      });
    }
  },

  logout: async (req, res) => {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
      const userId = req.user?._id;

      if (refreshToken) {
        await customerModel.findOneAndUpdate(
          { refreshToken },
          { $set: { refreshToken: null } },
          { returnDocument: 'after' },
        );
      } else if (userId) {
        await customerModel.findByIdAndUpdate(userId, { $set: { refreshToken: null } });
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

module.exports = customerController;
