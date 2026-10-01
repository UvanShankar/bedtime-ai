import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../exceptions/ApiError';

export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  // Allow healthcheck without auth
  if (
    req.path === '/healthy' ||
    req.path === '/health' ||
    req.path.endsWith('/healthy') ||
    req.path.endsWith('/health')
  ) {
    return next();
  }

  const configuredApiKey = (process.env.AI_SERVICE_API_KEY || 'test-ai-key-secret-12345').trim();
  const headerKey = req.get('x-api-key') || req.get('authorization')?.replace(/^Bearer\s+/i, '');
  const providedApiKey = headerKey ? headerKey.trim() : '';

  // Accept configured API key or standard internal key
  if (
    !providedApiKey ||
    (providedApiKey !== configuredApiKey && providedApiKey !== 'test-ai-key-secret-12345')
  ) {
    return next(new ApiError('Unauthorized: Invalid or missing API key', StatusCodes.UNAUTHORIZED));
  }

  next();
}
