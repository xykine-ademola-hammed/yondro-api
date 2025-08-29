"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const AuthService_1 = require("../services/AuthService");
class AuthController {
    static async login(req, res) {
        try {
            const loginData = req.body;
            if (!loginData.email || !loginData.password) {
                res.status(400).json({
                    success: false,
                    error: "Email and password are required",
                });
                return;
            }
            const authResponse = await AuthService_1.AuthService.login(loginData);
            res.json({
                success: true,
                message: "Login successful",
                data: authResponse,
            });
        }
        catch (error) {
            res.status(401).json({
                success: false,
                error: error.message || "Login failed",
            });
        }
    }
    static async signUp(req, res) {
        try {
            const signUpData = req.body;
            const requiredFields = [
                "email",
                "password",
                "firstName",
                "lastName",
                "departmentId",
                "positionId",
                "organizationId",
            ];
            const missingFields = requiredFields.filter((field) => !signUpData[field]);
            if (missingFields.length > 0) {
                res.status(400).json({
                    success: false,
                    error: `Missing required fields: ${missingFields.join(", ")}`,
                });
                return;
            }
            if (signUpData.password.length < 6) {
                res.status(400).json({
                    success: false,
                    error: "Password must be at least 6 characters long",
                });
                return;
            }
            const authResponse = await AuthService_1.AuthService.signUp(signUpData);
            res.status(201).json({
                success: true,
                message: "Account created successfully",
                data: authResponse,
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || "Registration failed",
            });
        }
    }
    static async logout(req, res) {
        res.json({
            success: true,
            message: "Logged out successfully",
        });
    }
    static async getProfile(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: "Authentication required",
                });
                return;
            }
            const profile = await AuthService_1.AuthService.getProfile(req.user.id);
            res.json({
                success: true,
                data: profile,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message || "Failed to get profile",
            });
        }
    }
    static async changePassword(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: "Authentication required",
                });
                return;
            }
            const { currentPassword, newPassword } = req.body;
            if (!currentPassword || !newPassword) {
                res.status(400).json({
                    success: false,
                    error: "Current password and new password are required",
                });
                return;
            }
            if (newPassword.length < 6) {
                res.status(400).json({
                    success: false,
                    error: "New password must be at least 6 characters long",
                });
                return;
            }
            await AuthService_1.AuthService.changePassword(req.user.id, currentPassword, newPassword);
            res.json({
                success: true,
                message: "Password changed successfully",
            });
        }
        catch (error) {
            res.status(400).json({
                success: false,
                error: error.message || "Failed to change password",
            });
        }
    }
    static async verifyToken(req, res) {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: "Invalid token",
                });
                return;
            }
            res.json({
                success: true,
                message: "Token is valid",
                data: {
                    user: req.user,
                },
            });
        }
        catch (error) {
            res.status(401).json({
                success: false,
                error: "Invalid token",
            });
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=AuthController.js.map