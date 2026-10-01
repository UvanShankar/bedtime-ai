import { Router } from 'express';
import voiceCloningController from '../controller/VoiceCloningController';

const router = Router();

router.post('/clone', (req, res, next) => voiceCloningController.cloneVoice(req, res, next));
router.get('/:voiceId', (req, res, next) => voiceCloningController.getVoice(req, res, next));

export const voiceRoutes = router;
