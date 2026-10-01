import { Router } from 'express';
import textGenerationController from '../controller/TextGenerationController';

const router = Router();

router.post('/generate', (req, res, next) => textGenerationController.generateText(req, res, next));
router.post('/structured', (req, res, next) => textGenerationController.generateStructured(req, res, next));

export const textRoutes = router;
