const jwt = require('jsonwebtoken');
const { HTTP_STATUS, ERROR_MESSAGE, JWT, ROLES } = require('../configs/constants');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message: ERROR_MESSAGE.NOT_LOGGED_IN,
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT.SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);

    const message =
      error.name === 'TokenExpiredError' ? 'Token đã hết hạn' : ERROR_MESSAGE.INVALID_TOKEN;

    res.status(HTTP_STATUS.UNAUTHORIZED).json({
      success: false,
      message,
    });
  }
};

const verifyRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user?.role) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        message: ERROR_MESSAGE.NOT_LOGGED_IN,
      });
    }

    const hasPermission = allowedRoles.some((role) => req.user.role.includes(role));

    if (!hasPermission) {
      return res.status(HTTP_STATUS.FORBIDDEN).json({
        success: false,
        message: ERROR_MESSAGE.ACCESS_DENIED,
      });
    }

    next();
  };
};

const verifyTokenCustomer = verifyRole(ROLES.CUSTOMER);
const verifyTokenAdmin = verifyRole(ROLES.ADMIN);
const verifyTokenAllRole = verifyRole(ROLES.ADMIN, ROLES.CUSTOMER);

const verifyRefreshToken = (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, JWT.REFRESH_SECRET);
    return {
      userId: decoded._id,
      isValid: true,
    };
  } catch (error) {
    console.error('Refresh token verification error:', error);
    return {
      isValid: false,
      error: error.name === 'TokenExpiredError' ? 'Token đã hết hạn' : ERROR_MESSAGE.INVALID_TOKEN,
    };
  }
};

module.exports = {
  verifyToken,
  verifyRole,
  verifyTokenCustomer,
  verifyTokenAdmin,
  verifyTokenAllRole,
  verifyRefreshToken,
};
