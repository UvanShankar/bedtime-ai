import { Request, Response, NextFunction } from 'express';
import logger from '../logger';

function sanitize(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  const sensitiveKeys = ['apikey', 'api-key', 'x-api-key', 'secret', 'token', 'authorization', 'password'];
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

  // Redact / sanitize incoming request body & query
  const sanitizedBody = req.body && Object.keys(req.body).length > 0 ? sanitize(req.body) : undefined;
  const sanitizedQuery = req.query && Object.keys(req.query).length > 0 ? sanitize(req.query) : undefined;

  logger.info(`📥 [AI-REQ] ${method} ${path}`, {
    ...(sanitizedQuery && { query: sanitizedQuery }),
    ...(sanitizedBody && { body: sanitizedBody }),
  });

  // Intercept finish event to log response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const logMsg = `📤 [AI-RES] ${method} ${path} -> ${statusCode} (${duration}ms)`;

    if (statusCode >= 500) {
      logger.error(logMsg, { statusCode, duration });
    } else if (statusCode >= 400) {
      logger.warn(logMsg, { statusCode, duration });
    } else {
      logger.info(logMsg, { statusCode, duration });
    }
  });

  next();
}
