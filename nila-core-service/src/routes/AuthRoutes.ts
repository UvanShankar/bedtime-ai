import { Router } from 'express';
import authController from '../controller/AuthController';

const router = Router();

router.post('/signup', (req, res, next) => authController.signup(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));

export const authRoutes = router;
