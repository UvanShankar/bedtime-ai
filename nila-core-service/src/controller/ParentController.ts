import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import parentService from '../services/ParentService';
import { IResponse } from '../types';

export class ParentController {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await parentService.getProfile(req.userId!);
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

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await parentService.updateProfile(req.userId!, req.body);
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

export default new ParentController();
