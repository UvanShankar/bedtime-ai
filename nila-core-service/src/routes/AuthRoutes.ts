import { Router } from 'express';
import authController from '../controller/AuthController';

const router = Router();

router.post('/send-otp', (req, res, next) => authController.sendOtp(req, res, next));
router.post('/verify-otp', (req, res, next) => authController.verifyOtp(req, res, next));
router.post('/signup', (req, res, next) => authController.signup(req, res, next));
router.post('/login', (req, res, next) => authController.login(req, res, next));

export const authRoutes = router;
