const jwt = require('jsonwebtoken');
const config = require('../config');

const generateToken = (user) => {
  const payload = {
    id: user.id,
    phone_number: user.phone_number,
    role: user.role,
  };

  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN,
  });
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, config.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

module.exports = {
  generateToken,
  verifyToken,
};
