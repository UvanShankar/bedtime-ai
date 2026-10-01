import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import memoryService from '../services/MemoryService';
import { IResponse } from '../types';

export class MemoryController {
  async getUploadUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { fileName, fileType } = req.body;
      const result = await memoryService.getPresignedUploadUrl(req.userId!, fileName, fileType);
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

  async createMemory(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await memoryService.createMemory(req.userId!, req.body);
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

  async getMemories(req: Request, res: Response, next: NextFunction) {
    try {
      const childId = req.query.childId as string | undefined;
      const result = await memoryService.getMemories(req.userId!, childId);
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

  async deleteMemory(req: Request, res: Response, next: NextFunction) {
    try {
      await memoryService.deleteMemory(req.params.memoryId);
      const response: IResponse<any> = {
        data: { message: 'Memory deleted successfully' },
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

export default new MemoryController();
