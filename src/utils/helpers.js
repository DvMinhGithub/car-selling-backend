const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const { JWT, SALT_ROUNDS } = require('#configs/constants');

const generateToken = (payload) => {
  return jwt.sign(payload, JWT.SECRET, { expiresIn: JWT.ACCESS_TOKEN_EXPIRES_IN });
};

const hashPassword = async (password) => {
  return await bcrypt.hash(password, SALT_ROUNDS);
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
  generateToken,
  hashPassword,
  comparePassword,
  formatResponse,
};
