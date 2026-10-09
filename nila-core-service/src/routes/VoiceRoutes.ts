import { Router } from 'express';
import voiceController from '../controller/VoiceController';
import { authenticateToken } from '../middleware/authenticateToken';

const router = Router();

router.use(authenticateToken);

router.get('/prompt', (req, res, next) => voiceController.getPrompt(req, res, next));
router.post('/upload-url', (req, res, next) => voiceController.getUploadUrl(req, res, next));
router.post('/', (req, res, next) => voiceController.registerVoice(req, res, next));
router.get('/', (req, res, next) => voiceController.getVoices(req, res, next));
router.get('/:voiceId/:provider', (req, res, next) => voiceController.getVoice(req, res, next));
router.get('/:voiceId', (req, res, next) => voiceController.getVoice(req, res, next));

export const voiceRoutes = router;
