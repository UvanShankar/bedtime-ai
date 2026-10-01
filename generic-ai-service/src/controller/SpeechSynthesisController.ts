import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import ttsService from '../services/TTSService';
import { IResponse } from '../types';

export class SpeechSynthesisController {
  async synthesize(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await ttsService.synthesizeSpeech(req.body);
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

export default new SpeechSynthesisController();
