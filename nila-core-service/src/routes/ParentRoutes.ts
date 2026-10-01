import { Router } from 'express';
import parentController from '../controller/ParentController';
import { authenticateToken } from '../middleware/authenticateToken';

const router = Router();

router.use(authenticateToken);

router.get('/profile', (req, res, next) => parentController.getProfile(req, res, next));
router.put('/profile', (req, res, next) => parentController.updateProfile(req, res, next));

export const parentRoutes = router;
