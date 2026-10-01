import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils';
import { UnauthorizedError } from '../exceptions/ApiError';

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : req.cookies?.accessToken;

  if (!token) {
    return next(new UnauthorizedError('Access token required'));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    req.userId = payload.userId;
    next();
  } catch (error) {
    return next(new UnauthorizedError('Invalid or expired access token'));
  }
}
