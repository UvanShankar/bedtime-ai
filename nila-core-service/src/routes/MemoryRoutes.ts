import { Router } from 'express';
import memoryController from '../controller/MemoryController';
import { authenticateToken } from '../middleware/authenticateToken';

const router = Router();

router.use(authenticateToken);

router.post('/upload-url', (req, res, next) => memoryController.getUploadUrl(req, res, next));
router.post('/', (req, res, next) => memoryController.createMemory(req, res, next));
router.get('/', (req, res, next) => memoryController.getMemories(req, res, next));
router.delete('/:memoryId', (req, res, next) => memoryController.deleteMemory(req, res, next));

export const memoryRoutes = router;
