import { Router } from 'express';
import multer from 'multer';
import memoryController from '../controller/MemoryController';
import { authenticateToken } from '../middleware/authenticateToken';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticateToken);

router.post('/upload', upload.any(), (req, res, next) => memoryController.getUploadUrl(req, res, next));
router.post('/upload-url', upload.any(), (req, res, next) => memoryController.getUploadUrl(req, res, next));
router.post('/', (req, res, next) => memoryController.createMemory(req, res, next));
router.get('/', (req, res, next) => memoryController.getMemories(req, res, next));
router.get('/:memoryId', (req, res, next) => memoryController.getMemory(req, res, next));
router.put('/:memoryId', (req, res, next) => memoryController.updateMemory(req, res, next));
router.delete('/:memoryId', (req, res, next) => memoryController.deleteMemory(req, res, next));

export const memoryRoutes = router;
