const { AppError } = require('../errors/AppError');
const logger = require('../utils/logger'); // We will ensure logger exists

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  
  if (err.name === 'ZodError') {
    const details = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    error = new AppError('Validation Error', 400, 'VALIDATION_ERROR');
    error.details = details;
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    error = new AppError('Duplicate field value entered', 409, 'CONFLICT_ERROR');
  }
  
  if (err.name === 'SequelizeValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new AppError(message, 400, 'VALIDATION_ERROR');
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Server Error';
  const code = error.code || 'INTERNAL_SERVER_ERROR';

  if (!error.isOperational) {
    // Log unexpected errors
    console.error('UNEXPECTED ERROR:', err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(error.details && { details: error.details }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }), // Only in dev
      requestId: req.requestId || null,
    }
  });
};

module.exports = errorHandler;
