/**
 * Error handling utilities for API endpoints (CommonJS version)
 */

/**
 * Handles errors consistently across API endpoints
 */
function handleError(res, error, statusCode = 500) {
  console.error('API Error:', error);
  
  // Return structured error response
  res.status(statusCode).json({
    success: false,
    error: {
      message: error.message || 'Internal server error',
      code: error.code || 'UNKNOWN_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }
  });
}

/**
 * Sends successful response with data
 */
function sendSuccess(res, data, statusCode = 200) {
  res.status(statusCode).json({
    success: true,
    data
  });
}

module.exports = {
  handleError,
  sendSuccess
};