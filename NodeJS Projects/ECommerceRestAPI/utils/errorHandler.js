/**
 * Custom Error Handler Class
 * Provides structured error handling throughout the API
 */

class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Format error response
 * @param {Error} error - Error object
 * @returns {Object} Formatted error object
 */
const formatError = (error) => {
  return {
    success: false,
    statusCode: error.statusCode || 500,
    message: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  };
};

/**
 * Handle MongoDB Validation Error
 * @param {Error} error - Mongoose validation error
 * @returns {ErrorHandler} Formatted error
 */
const handleValidationError = (error) => {
  const messages = Object.values(error.errors)
    .map(err => err.message)
    .join(', ');
  
  return new ErrorHandler(`Validation Error: ${messages}`, 400);
};

/**
 * Handle MongoDB Duplicate Key Error
 * @param {Error} error - Mongoose duplicate key error
 * @returns {ErrorHandler} Formatted error
 */
const handleDuplicateKeyError = (error) => {
  const field = Object.keys(error.keyPattern)[0];
  const value = error.keyValue[field];
  
  return new ErrorHandler(
    `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists`,
    400
  );
};

/**
 * Handle JWT Errors
 * @param {Error} error - JWT error
 * @returns {ErrorHandler} Formatted error
 */
const handleJWTError = () => {
  return new ErrorHandler('Invalid or expired token. Please login again.', 401);
};

/**
 * Handle JWT Expired Error
 * @returns {ErrorHandler} Formatted error
 */
const handleJWTExpiredError = () => {
  return new ErrorHandler('Token has expired. Please login again.', 401);
};

/**
 * Handle Cast Error (Invalid MongoDB ID)
 * @param {Error} error - Cast error
 * @returns {ErrorHandler} Formatted error
 */
const handleCastError = (error) => {
  return new ErrorHandler(
    `Invalid ${error.path}: ${error.value}`,
    400
  );
};

/**
 * Process different error types and return appropriate ErrorHandler
 * @param {Error} error - Original error
 * @returns {ErrorHandler} Processed error
 */
const processError = (error) => {
  // Mongoose Validation Error
  if (error.name === 'ValidationError') {
    return handleValidationError(error);
  }

  // Mongoose Duplicate Key Error
  if (error.code === 11000) {
    return handleDuplicateKeyError(error);
  }

  // JWT Errors
  if (error.name === 'JsonWebTokenError') {
    return handleJWTError();
  }

  if (error.name === 'TokenExpiredError') {
    return handleJWTExpiredError();
  }

  // Mongoose Cast Error
  if (error.name === 'CastError') {
    return handleCastError(error);
  }

  // Default: Return original error if it's already an ErrorHandler
  if (error instanceof ErrorHandler) {
    return error;
  }

  // If it's a generic error, wrap it
  return new ErrorHandler(error.message || 'Internal Server Error', error.statusCode || 500);
};

module.exports = {
  ErrorHandler,
  formatError,
  handleValidationError,
  handleDuplicateKeyError,
  handleJWTError,
  handleJWTExpiredError,
  handleCastError,
  processError
};
