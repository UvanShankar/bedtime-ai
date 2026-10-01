import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import llmService from '../services/LLMService';
import { IResponse, IChatGPTResponseDTO } from '../types';
import { ApiError } from '../exceptions/ApiError';

export class ChatController {
  async chat(req: Request, res: Response, next: NextFunction) {
    try {
      const { text, prompt, messages } = req.body;

      if (!text && !prompt && (!messages || !Array.isArray(messages) || messages.length === 0)) {
        throw new ApiError('Please provide "text" (or "prompt" / "messages") in the request body', StatusCodes.BAD_REQUEST);
      }

      const result = await llmService.chat(req.body);

      const response: IResponse<IChatGPTResponseDTO> = {
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

export default new ChatController();
