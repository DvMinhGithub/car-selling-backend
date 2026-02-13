const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const { JWT, SECURITY } = require('#configs/constants');

const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT.SECRET, { expiresIn: JWT.ACCESS_TOKEN_EXPIRES_IN });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT.REFRESH_SECRET, { expiresIn: JWT.REFRESH_TOKEN_EXPIRES_IN });
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, JWT.REFRESH_SECRET);
};

const hashPassword = async (password) => {
  return await bcrypt.hash(password, SECURITY.SALT_ROUNDS);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

const formatResponse = (success, message, data = null, error = null) => {
  return {
    success,
    message,
    data,
    error,
  };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashPassword,
  comparePassword,
  formatResponse,
};
