const config = require('../config');

// 404 Not Found Middleware
const notFound = (req, res, next) => {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global Error Handling Middleware
const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // Handle Mongoose validation errors
  let message = err.message;
  let errors = null;

  if (err.name === 'ValidationError') {
    message = 'Validation Error';
    errors = Object.values(err.errors).map((val) => val.message);
  } else if (err.code === 11000) {
    message = 'Duplicate field value entered';
    const field = Object.keys(err.keyValue)[0];
    errors = [`${field} already exists`];
  } else if (err.name === 'CastError') {
    message = `Resource not found with id of ${err.value}`;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
};

module.exports = { notFound, errorHandler };
