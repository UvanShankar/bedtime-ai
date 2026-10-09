import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import voiceCloneService from '../services/VoiceCloneService';
import aiVoiceRegistryDao from '../dao/AIVoiceRegistryDao';
import { IResponse } from '../types';
import { NotFoundError, ValidationError } from '../exceptions/ApiError';

export class VoiceCloningController {
  async uploadSample(req: Request, res: Response, next: NextFunction) {
    try {
      const ownerProject = (req.body?.ownerProject || 'general').trim();
      const externalReferenceId = req.body?.externalReferenceId;

      let audioBuffer: Buffer | null = null;
      let originalName = 'audio-sample.wav';
      let mimeType = 'audio/wav';

      if (req.file) {
        audioBuffer = req.file.buffer;
        originalName = req.file.originalname || originalName;
        mimeType = req.file.mimetype || mimeType;
      } else if (req.body?.audioBase64) {
        audioBuffer = Buffer.from(req.body.audioBase64, 'base64');
        originalName = req.body.fileName || originalName;
        mimeType = req.body.contentType || mimeType;
      }

      if (!audioBuffer || audioBuffer.length === 0) {
        throw new ValidationError('No audio sample provided. Upload a file using multipart/form-data or send audioBase64 in JSON body.');
      }

      const result = await voiceCloneService.uploadSampleAudio({
        buffer: audioBuffer,
        fileName: originalName,
        mimeType,
        ownerProject,
        externalReferenceId,
      });

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

  async getPresignedSampleUrl(req: Request, res: Response, next: NextFunction) {
    try {
      const { fileName, contentType, ownerProject } = req.body;
      if (!fileName) {
        throw new ValidationError('fileName is required to generate a presigned upload URL.');
      }

      const result = await voiceCloneService.getPresignedSampleUploadUrl({
        fileName,
        contentType,
        ownerProject,
      });

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
  async cloneVoice(req: Request, res: Response, next: NextFunction) {
    try {
      const body = { ...req.body };
      // Allow passing either sampleAudioUrls (array), sampleAudioUrl (string), or audioS3Key (string)
      if (!body.sampleAudioUrls && (body.sampleAudioUrl || body.audioS3Key)) {
        body.sampleAudioUrls = [body.sampleAudioUrl || body.audioS3Key];
      }
      const result = await voiceCloneService.cloneVoice(body);
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
      const provider = (req.query.provider as string) || (req.query.voiceProvider as string) || (req.params as any).provider;
      const voice = await aiVoiceRegistryDao.getVoice(voiceId, provider);
      if (!voice) {
        throw new NotFoundError(`AI Voice "${voiceId}"${provider ? ` with provider "${provider}"` : ''} not found`);
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
