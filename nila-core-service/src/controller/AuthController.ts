import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import authService from '../services/AuthService';
import { IResponse } from '../types';

export class AuthController {
  async sendOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.sendOtp(req.body);
      const response: IResponse<any> = {
        data: result,
        success: true,
        statusCode: StatusCodes.OK,
        error: null,
      };
      return res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.verifyOtp(req.body);
      const response: IResponse<any> = {
        data: result,
        success: true,
        statusCode: StatusCodes.OK,
        error: null,
      };
      return res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  }

  async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.signup(req.body);
      const response: IResponse<any> = {
        data: result,
        success: true,
        statusCode: StatusCodes.CREATED,
        error: null,
      };
      return res.status(StatusCodes.CREATED).json(response);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.login(req.body);
      const response: IResponse<any> = {
        data: result,
        success: true,
        statusCode: StatusCodes.OK,
        error: null,
      };
      return res.status(StatusCodes.OK).json(response);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
