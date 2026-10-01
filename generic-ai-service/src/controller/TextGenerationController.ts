import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import llmService from '../services/LLMService';
import { IResponse } from '../types';

export class TextGenerationController {
  async generateText(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await llmService.generateText(req.body);
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

  async generateStructured(req: Request, res: Response, next: NextFunction) {
    try {
      const { jsonSchema, ...dto } = req.body;
      const result = await llmService.generateStructuredJson(dto, jsonSchema);
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

export default new TextGenerationController();
