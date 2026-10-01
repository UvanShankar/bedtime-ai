import { Router } from 'express';
import speechSynthesisController from '../controller/SpeechSynthesisController';

const router = Router();

router.post('/synthesize', (req, res, next) => speechSynthesisController.synthesize(req, res, next));

export const speechRoutes = router;
