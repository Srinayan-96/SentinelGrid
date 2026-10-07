const { AuthorizationError } = require('../errors/AppError');

function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AuthorizationError('Forbidden'));
    }
    return next();
  };
}

module.exports = { requireRoles };
