import { Router } from 'express';
import textGenerationController from '../controller/TextGenerationController';
import chatController from '../controller/ChatController';

const router = Router();

router.post('/generate', (req, res, next) => textGenerationController.generateText(req, res, next));
router.post('/structured', (req, res, next) => textGenerationController.generateStructured(req, res, next));
router.post('/chat', (req, res, next) => chatController.chat(req, res, next));

export const textRoutes = router;
