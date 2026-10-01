import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import voiceCloneService from '../services/VoiceCloneService';
import aiVoiceRegistryDao from '../dao/AIVoiceRegistryDao';
import { IResponse } from '../types';
import { NotFoundError } from '../exceptions/ApiError';

export class VoiceCloningController {
  async cloneVoice(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await voiceCloneService.cloneVoice(req.body);
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

  async getVoice(req: Request, res: Response, next: NextFunction) {
    try {
      const { voiceId } = req.params;
      const voice = await aiVoiceRegistryDao.getVoice(voiceId);
      if (!voice) {
        throw new NotFoundError(`AI Voice ${voiceId} not found`);
      }
      const response: IResponse<any> = {
        data: voice,
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

export default new VoiceCloningController();
