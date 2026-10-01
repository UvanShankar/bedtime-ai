import { Router } from 'express';
import aiJobsController from '../controller/AIJobsController';

const router = Router();

router.post('/pipeline', (req, res, next) => aiJobsController.createPipelineJob(req, res, next));
router.get('/:jobId', (req, res, next) => aiJobsController.getJobStatus(req, res, next));

export const jobRoutes = router;
