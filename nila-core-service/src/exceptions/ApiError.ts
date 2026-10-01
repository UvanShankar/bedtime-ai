import { StatusCodes } from 'http-status-codes';

export class ApiError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = StatusCodes.INTERNAL_SERVER_ERROR) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends ApiError {
  public errors: any;

  constructor(message: string, errors: any = null) {
    super(message, StatusCodes.BAD_REQUEST);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(message, StatusCodes.NOT_FOUND);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(message, StatusCodes.UNAUTHORIZED);
    this.name = 'UnauthorizedError';
  }
}
