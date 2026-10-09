import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import storyService from '../services/StoryService';
import { IResponse } from '../types';

export class StoryController {
  async requestStory(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await storyService.requestStory(req.userId!, req.body);
      const isReady = result.status === 'READY';
      const statusCode = isReady ? StatusCodes.OK : StatusCodes.ACCEPTED;
      const response: IResponse<any> = {
        data: result,
        success: true,
        statusCode,
        error: null,
      };
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getStoryStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await storyService.getStoryStatus(req.params.storyId);
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

  async getStory(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await storyService.getStory(req.params.storyId);
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

  async getStories(req: Request, res: Response, next: NextFunction) {
    try {
      const childId = req.query.childId as string | undefined;
      const result = await storyService.getStories(req.userId!, childId);
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

  async toggleFavorite(req: Request, res: Response, next: NextFunction) {
    try {
      const { isFavorite } = req.body;
      await storyService.toggleFavorite(req.params.storyId, Boolean(isFavorite));
      const response: IResponse<any> = {
        data: { message: 'Favorite updated successfully' },
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

export default new StoryController();
