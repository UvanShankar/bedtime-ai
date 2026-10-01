import { Router } from 'express';
import chatController from '../controller/ChatController';

const router = Router();

// POST /api/v1/ai/chat -> Direct text in, response text out
router.post('/', (req, res, next) => chatController.chat(req, res, next));
router.post('/completions', (req, res, next) => chatController.chat(req, res, next));
router.post('/chatgpt', (req, res, next) => chatController.chat(req, res, next));

export const chatRoutes = router;
