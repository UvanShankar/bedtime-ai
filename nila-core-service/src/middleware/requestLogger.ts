import { Request, Response, NextFunction } from 'express';
import logger from '../logger';

function sanitize(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  const sensitiveKeys = ['password', 'otp', 'accesstoken', 'refreshtoken', 'authorization', 'token'];
  const sanitized: Record<string, any> = Array.isArray(obj) ? [] : {};

  for (const [key, val] of Object.entries(obj)) {
    if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
      sanitized[key] = '***REDACTED***';
    } else if (val && typeof val === 'object') {
      sanitized[key] = sanitize(val);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const method = req.method;
  const path = req.originalUrl || req.url;

  // Log incoming request
  const sanitizedBody = req.body && Object.keys(req.body).length > 0 ? sanitize(req.body) : undefined;
  const sanitizedQuery = req.query && Object.keys(req.query).length > 0 ? sanitize(req.query) : undefined;

  logger.info(`📥 [REQ] ${method} ${path}`, {
    ...(req.userId && { userId: req.userId }),
    ...(sanitizedQuery && { query: sanitizedQuery }),
    ...(sanitizedBody && { body: sanitizedBody }),
  });

  // Intercept finish event to log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const logMsg = `📤 [RES] ${method} ${path} -> ${statusCode} (${duration}ms)`;

    if (statusCode >= 500) {
      logger.error(logMsg, { statusCode, duration, ...(req.userId && { userId: req.userId }) });
    } else if (statusCode >= 400) {
      logger.warn(logMsg, { statusCode, duration, ...(req.userId && { userId: req.userId }) });
    } else {
      logger.info(logMsg, { statusCode, duration, ...(req.userId && { userId: req.userId }) });
    }
  });

  next();
}
