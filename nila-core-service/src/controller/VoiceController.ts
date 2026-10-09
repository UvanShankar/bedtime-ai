import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import voiceService from '../services/VoiceService';
import { IResponse } from '../types';

export class VoiceController {
  getPrompt(req: Request, res: Response, next: NextFunction) {
    try {
      const result = voiceService.getPrompt();
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

  async getUploadUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { fileName, fileType } = req.body;
      const result = await voiceService.getPresignedUploadUrl(req.userId!, fileName, fileType);
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

  async registerVoice(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await voiceService.registerVoice(req.userId!, req.body);
      const response: IResponse<any> = {
        data: result,
        success: true,
        statusCode: StatusCodes.ACCEPTED,
        error: null,
      };
      return res.status(StatusCodes.ACCEPTED).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getVoices(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await voiceService.getVoices(req.userId!);
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

  async getVoice(req: Request, res: Response, next: NextFunction) {
    try {
      const provider = (req.query.provider as string) || (req.query.voiceProvider as string) || (req.params as any).provider;
      const result = await voiceService.getVoice(req.params.voiceId, provider);
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

export default new VoiceController();
