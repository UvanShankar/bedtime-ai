import { Router } from 'express';
import storyController from '../controller/StoryController';
import { authenticateToken } from '../middleware/authenticateToken';

const router = Router();

router.use(authenticateToken);

router.post('/generate', (req, res, next) => storyController.requestStory(req, res, next));
router.get('/:storyId/status', (req, res, next) => storyController.getStoryStatus(req, res, next));
router.get('/:storyId', (req, res, next) => storyController.getStory(req, res, next));
router.get('/', (req, res, next) => storyController.getStories(req, res, next));
router.put('/:storyId/favorite', (req, res, next) => storyController.toggleFavorite(req, res, next));

export const storyRoutes = router;
