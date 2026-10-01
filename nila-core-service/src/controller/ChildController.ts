import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import childService from '../services/ChildService';
import { IResponse } from '../types';

export class ChildController {
  async createChild(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await childService.createChild(req.userId!, req.body);
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

  async getChildren(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await childService.getChildren(req.userId!);
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

  async getChild(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await childService.getChild(req.params.childId);
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

  async updateChild(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await childService.updateChild(req.params.childId, req.body);
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

  async deleteChild(req: Request, res: Response, next: NextFunction) {
    try {
      await childService.deleteChild(req.params.childId);
      const response: IResponse<any> = {
        data: { message: 'Child profile deleted successfully' },
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

export default new ChildController();
