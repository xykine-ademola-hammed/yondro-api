import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authenticate } from '../middleware/auth';
import { validateRequest, loginSchema, signUpSchema, changePasswordSchema } from '../middleware/validation';

const router = Router();

// Public routes
router.post('/auth/login', validateRequest(loginSchema), AuthController.login);
router.post('/auth/signup', validateRequest(signUpSchema), AuthController.signUp);
router.post('/auth/logout', AuthController.logout);

// Protected routes
router.get('/auth/profile', authenticate, AuthController.getProfile);
router.put('/auth/change-password', authenticate, validateRequest(changePasswordSchema), AuthController.changePassword);
router.get('/auth/verify', authenticate, AuthController.verifyToken);

export default router;