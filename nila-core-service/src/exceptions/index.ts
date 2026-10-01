import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { ApiError, ValidationError } from './ApiError';
import { IResponse } from '../types';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('[Nila Core Service Error]', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
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
