"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../controllers/AuthController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.post('/auth/login', (0, validation_1.validateRequest)(validation_1.loginSchema), AuthController_1.AuthController.login);
router.post('/auth/signup', (0, validation_1.validateRequest)(validation_1.signUpSchema), AuthController_1.AuthController.signUp);
router.post('/auth/logout', AuthController_1.AuthController.logout);
router.get('/auth/profile', auth_1.authenticate, AuthController_1.AuthController.getProfile);
router.put('/auth/change-password', auth_1.authenticate, (0, validation_1.validateRequest)(validation_1.changePasswordSchema), AuthController_1.AuthController.changePassword);
router.get('/auth/verify', auth_1.authenticate, AuthController_1.AuthController.verifyToken);
exports.default = router;
//# sourceMappingURL=auth.js.map