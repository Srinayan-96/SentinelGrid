const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { AuthenticationError } = require('../errors/AppError');

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return next(new AuthenticationError('Missing access token'));

  try {
    const secret = process.env.JWT_SECRET || 'dev_secret_key_123';
    const decoded = jwt.verify(token, secret);
    const user = await User.findByPk(decoded.id);
    if (!user) return next(new AuthenticationError('User not found'));
    req.user = user;
    req.auth = decoded;
    return next();
  } catch {
    return next(new AuthenticationError('Invalid or expired token'));
  }
}

module.exports = { requireAuth };
