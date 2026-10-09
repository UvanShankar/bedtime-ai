import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import jobExecutionService from '../services/JobExecutionService';
import { IResponse } from '../types';
import { NotFoundError } from '../exceptions/ApiError';

export class AIJobsController {
  async createPipelineJob(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await jobExecutionService.submitPipelineJob(req.body);
      const isCompleted = result.status === 'COMPLETED';
      const statusCode = isCompleted ? StatusCodes.OK : StatusCodes.ACCEPTED;
      const response: IResponse<any, any> = {
        data: result,
        success: isCompleted,
        statusCode,
        error: isCompleted ? null : { code: 'JOB_FAILED', message: result.errorMessage || 'Job execution failed' },
      };
      return res.status(statusCode).json(response);
    } catch (error) {
      next(error);
    }
  }

  async getJobStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { jobId } = req.params;
      const job = await jobExecutionService.getJobStatus(jobId);
      if (!job) {
        throw new NotFoundError(`AI Job ${jobId} not found`);
      }
      const response: IResponse<any> = {
        data: job,
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

export default new AIJobsController();
