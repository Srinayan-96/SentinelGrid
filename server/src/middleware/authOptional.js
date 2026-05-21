const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_123';

function getBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header) return null;
  const parts = String(header).split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') return parts[1];
  return null;
}

module.exports = function authOptional(req, _res, next) {
  const token = getBearerToken(req);
  if (!token) return next();
  try {
    req.auth = jwt.verify(token, JWT_SECRET);
  } catch {
    req.auth = null;
  }
  return next();
};

