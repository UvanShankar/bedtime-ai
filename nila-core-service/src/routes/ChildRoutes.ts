import { Router } from 'express';
import childController from '../controller/ChildController';
import { authenticateToken } from '../middleware/authenticateToken';

const router = Router();

router.use(authenticateToken);

router.post('/', (req, res, next) => childController.createChild(req, res, next));
router.get('/', (req, res, next) => childController.getChildren(req, res, next));
router.get('/:childId', (req, res, next) => childController.getChild(req, res, next));
router.put('/:childId', (req, res, next) => childController.updateChild(req, res, next));
router.delete('/:childId', (req, res, next) => childController.deleteChild(req, res, next));

export const childRoutes = router;
