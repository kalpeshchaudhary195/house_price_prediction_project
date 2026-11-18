/**
 * Global Error Handler Middleware
 */

export function errorHandler(err, req, res, next) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[API Error] ${req.method} ${req.url} (${status}):`, err.message);
  if (status === 500 && process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  res.status(status).json({
    success: false,
    error: message,
    statusCode: status,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
}

