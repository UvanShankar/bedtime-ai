import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../exceptions/ApiError';

export function apiKeyAuth(req: Request, res: Response, next: NextFunction) {
  // Allow healthcheck without auth
  if (req.path === '/healthy' || req.path === '/health') {
    return next();
  }

  const configuredApiKey = process.env.AI_SERVICE_API_KEY || 'test-ai-key-secret-12345';
  const providedApiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');

  if (!providedApiKey || providedApiKey !== configuredApiKey) {
    return next(new ApiError('Unauthorized: Invalid or missing API key', StatusCodes.UNAUTHORIZED));
  }

  next();
}
