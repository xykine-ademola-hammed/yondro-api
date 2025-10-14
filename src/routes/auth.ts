import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { authenticate } from "../middleware/auth";
import {
  validateRequest,
  loginSchema,
  signUpSchema,
  changePasswordSchema,
} from "../middleware/validation";

const router = Router();

// Public routes
router.post("/auth/login", validateRequest(loginSchema), AuthController.login);
router.post(
  "/auth/signup",
  validateRequest(signUpSchema),
  AuthController.signUp
);
router.post("/auth/logout", AuthController.logout);
router.post("/auth/refresh", AuthController.refresh);
router.post("/auth/reset", AuthController.reset);
router.post("/auth/reset/exchange", AuthController.exchange);
router.post("/auth/reset/resend", AuthController.resend);
router.get("/auth/reset/status", AuthController.status);
router.post("/auth/reset/confirm", AuthController.confirm);
router.post("/auth/help/reset", AuthController.helpReset);

router.post("/auth/admin/users/:id/activate", AuthController.activate);
router.post("/auth/admin/users/:id/deactivate", AuthController.deactivate);
router.post(
  "/auth/admin/users/:id/reset",
  AuthController.adminInitPasswordReset
);

// Protected routes
router.get("/auth/profile", authenticate, AuthController.getProfile);
router.put(
  "/auth/change-password",
  authenticate,
  validateRequest(changePasswordSchema),
  AuthController.changePassword
);
router.get("/auth/verify", authenticate, AuthController.verifyToken);

export default router;
