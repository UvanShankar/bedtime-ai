import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiError, ValidationError } from './ApiError';
import { IResponse } from '../types';
import logger from '../logger';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error(`❌ [ERROR] ${req.method} ${req.originalUrl || req.path}: ${err.message}`, {
    name: err.name,
    message: err.message,
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    path: req.originalUrl || req.path,
    method: req.method,
    stack: err.stack,
  });

  const statusCode = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const errorMessage = err.message || 'Internal Server Error';

  const response: IResponse<null, any> = {
    data: null,
    success: false,
    statusCode,
    error: err instanceof ValidationError && err.errors ? err.errors : errorMessage,
  };

  return res.status(statusCode).json(response);
}
