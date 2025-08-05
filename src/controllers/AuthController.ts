import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import { LoginRequest, SignUpRequest } from "../types";

export class AuthController {
  /**
   * POST /auth/login - User login
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData: LoginRequest = req.body;

      if (!loginData.email || !loginData.password) {
        res.status(400).json({
          success: false,
          error: "Email and password are required",
        });
        return;
      }

      const authResponse = await AuthService.login(loginData);

      res.json({
        success: true,
        message: "Login successful",
        data: authResponse,
      });
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: error.message || "Login failed",
      });
    }
  }

  /**
   * POST /auth/signup - User registration
   */
  static async signUp(req: Request, res: Response): Promise<void> {
    try {
      const signUpData: SignUpRequest = req.body;
      const requiredFields = [
        "email",
        "password",
        "firstName",
        "lastName",
        "departmentId",
        "positionId",
        "organizationId",
      ];
      const missingFields = requiredFields.filter(
        (field) => !signUpData[field as keyof SignUpRequest]
      );

      if (missingFields.length > 0) {
        res.status(400).json({
          success: false,
          error: `Missing required fields: ${missingFields.join(", ")}`,
        });
        return;
      }

      // Validate password strength
      if (signUpData.password.length < 6) {
        res.status(400).json({
          success: false,
          error: "Password must be at least 6 characters long",
        });
        return;
      }

      const authResponse = await AuthService.signUp(signUpData);

      res.status(201).json({
        success: true,
        message: "Account created successfully",
        data: authResponse,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || "Registration failed",
      });
    }
  }

  /**
   * POST /auth/logout - User logout (client-side token removal)
   */
  static async logout(req: Request, res: Response): Promise<void> {
    // Since we're using stateless JWT tokens, logout is handled client-side
    // by removing the token from storage
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  }

  /**
   * GET /auth/profile - Get current user profile
   */
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
        return;
      }

      const profile = await AuthService.getProfile(req.user.id);

      res.json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: error.message || "Failed to get profile",
      });
    }
  }

  /**
   * PUT /auth/change-password - Change user password
   */
  static async changePassword(req: Request, res: Response): Promise<void> {
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

      await AuthService.changePassword(
        req.user.id,
        currentPassword,
        newPassword
      );

      res.json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: error.message || "Failed to change password",
      });
    }
  }

  /**
   * GET /auth/verify - Verify token validity
   */
  static async verifyToken(req: Request, res: Response): Promise<void> {
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
    } catch (error: any) {
      res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    }
  }
}
