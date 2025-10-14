import { Request, Response } from "express";
import { AuthService } from "../services/AuthService";
import { LoginRequest, SignUpRequest } from "../types";
import { Employee, PasswordReset } from "../models";
import { Op } from "sequelize";
import { SecurityService } from "../services/SecurityService";
import { AuditEventType, AuditService } from "../services/AuditService";
import { EmailService } from "../services/EmailService";

export class AuthController {
  static async helpReset(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user!;
      const { reason } = req.body;

      await AuditService.logFromRequest(
        req,
        AuditEventType.HELP_REQUEST,
        user.id,
        undefined,
        {
          type: "password_reset_help",
          reason: reason || "lost_email_access",
          currentEmail: user.email,
        }
      );

      res.status(200).json({
        ok: true,
        message:
          "Help request submitted. Our support team will contact you soon.",
      });
    } catch (error) {
      console.error("Help request error:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }

  static async confirm(req: Request, res: Response): Promise<void> {
    try {
      const { newPassword } = req.body;
      const cookieValue = req.cookies?.pwreset;

      console.log("------------COOKIEVALUE----", req.cookies);

      if (!cookieValue) {
        res.status(401).json({
          error: "Reset session expired. Please request a new link. --1 ",
          code: "PWRESET_WINDOW_EXPIRED",
        });
        return;
      }
      if (!newPassword || typeof newPassword !== "string") {
        res.status(400).json({ error: "New password is required." });
        return;
      }

      // Password policy
      const strengthCheck =
        SecurityService.validatePasswordStrength(newPassword);
      if (!strengthCheck.valid) {
        res.status(400).json({ error: strengthCheck.message });
      }

      // Check password breaches
      const isBreached = await SecurityService.checkPasswordBreach(newPassword);

      if (isBreached) {
        res.status(400).json({
          error:
            "Please choose a stronger password. This password has been found in data breaches.",
        });
        return;
      }

      const parsed = SecurityService.parseCookieValue(cookieValue);
      if (!parsed) {
        res.status(401).json({
          error: "Invalid reset session.",
          code: "PWRESET_WINDOW_EXPIRED",
        });
        return;
      }
      let nonceHash;
      if (parsed?.nonce) nonceHash = SecurityService.hashToken(parsed?.nonce);
      const now = new Date();

      const passwordReset = await PasswordReset.findOne({
        where: {
          id: parsed?.resetId,
          exchangeNonceHash: nonceHash,
          usedAt: null,
          exchangeExpiresAt: { [Op.gt]: now },
        },
        include: [{ model: Employee, as: "user" }],
      });

      if (!passwordReset) {
        res.status(401).json({
          error: "Reset session expired. Please request a new link. -- 2",
          code: "PWRESET_WINDOW_EXPIRED",
        });
        return;
      }

      const user = passwordReset?.user;
      if (!user) {
        res.status(400).json({ error: "User not found." });
        return;
      }

      // Hash and set new password
      // const newPasswordHash = await AuthService.hashPassword(newPassword);

      await user?.update({
        password: newPassword,
        updatedAt: new Date(),
      });

      await passwordReset?.update({ usedAt: new Date() });
      res.clearCookie("pwreset", { path: "/auth/reset" });

      // Email notification
      await new EmailService().sendPasswordChangedEmail({
        user,
        changeDetails: {
          timestamp: new Date(),
          ip: req.ip || "unknown",
          browser: req.get("User-Agent"),
        },
      });

      // Audit
      await AuditService.logFromRequest(
        req,
        AuditEventType.PW_CHANGED,
        user?.id,
        undefined,
        { method: "reset_flow" }
      );

      res.status(200).json({ ok: true });
    } catch (error) {
      console.error("Password confirm error:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }

  static async status(req: Request, res: Response): Promise<void> {
    try {
      const cookieValue = req.cookies?.pwreset;
      if (!cookieValue) {
        res.status(200).json({ valid: false, remainingSec: 0 });
        return;
      }

      const parsed = SecurityService.parseCookieValue(cookieValue);
      if (!parsed) {
        res.status(200).json({ valid: false, remainingSec: 0 });
        return;
      }

      const nonceHash = parsed?.nonce
        ? SecurityService.hashToken(parsed?.nonce)
        : "";
      const now = new Date();

      const passwordReset = await PasswordReset.findOne({
        where: {
          id: parsed?.resetId,
          exchangeNonceHash: nonceHash,
          usedAt: null,
          exchangeExpiresAt: { [Op.gt]: now },
        },
      });
      if (!passwordReset) {
        res.status(200).json({ valid: false, remainingSec: 0 });
        return;
      }
      const expiresAt = passwordReset?.exchangeExpiresAt?.getTime();
      const remainingTime = expiresAt
        ? Math.max(0, expiresAt - now.getTime())
        : 0;
      const remainingSec = Math.floor(remainingTime / 1000);

      res.status(200).json({
        valid: true,
        remainingSec,
      });
    } catch (error) {
      console.error("Status check error:", error);
      res.status(200).json({ valid: false, remainingSec: 0 });
    }
  }

  static async resend(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string") {
        await SecurityService.addJitter();
        res.status(200).json({
          message: "If an account exists, we resent instructions.",
        });
      }

      const normalizedEmail = email.toLowerCase().trim();
      const user = await Employee.findOne({
        where: { email: normalizedEmail },
      });
      if (!user) {
        await SecurityService.addJitter();
        res.status(200).json({
          message: "If an account exists, we resent instructions.",
        });
      }

      // Only allow resending if recent request does not exist
      const existingReset = await PasswordReset.findOne({
        where: {
          userId: user?.id,
          usedAt: null,
          expiresAt: { [Op.gt]: new Date() },
        },
        order: [["createdAt", "DESC"]],
      });
      if (!existingReset) {
        await SecurityService.addJitter();
        res.status(200).json({
          message: "If an account exists, we resent instructions.",
        });
      }
      // Throttle: 1 minute
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      if (existingReset?.createdAt && existingReset?.createdAt > oneMinuteAgo) {
        await SecurityService.addJitter();
        res.status(200).json({
          message: "If an account exists, we resent instructions.",
        });
      }

      await existingReset?.update({ usedAt: new Date() });

      const token = SecurityService.generateToken(32);
      const tokenHash = SecurityService.hashToken(token);
      const expiryMinutes = 20;
      const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

      await PasswordReset.create({
        userId: user?.id,
        tokenHash,
        createdAt: new Date(),
        expiresAt,
        requestIp: SecurityService.ipToBuffer(req.ip || ""),
      });

      const resetLink = `${
        process.env.FRONTEND_URL
      }/reset?token=${encodeURIComponent(token)}`;
      await new EmailService().sendResetEmail({
        user,
        resetLink,
        expiryMinutes,
        requestDetails: {
          ip: req.ip || "unknown",
          timestamp: new Date(),
          browser: req.get("User-Agent"),
        },
      });

      await AuditService.logFromRequest(
        req,
        AuditEventType.PW_RESET_EMAIL_SENT,
        user?.id,
        undefined,
        { resend: true }
      );

      res.status(200).json({
        message: "If an account exists, we resent instructions.",
      });
    } catch (error) {
      console.error("Reset resend error:", error);
      await SecurityService.addJitter();
      res.status(200).json({
        message: "If an account exists, we resent instructions.",
      });
    }
  }

  static async exchange(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;
      if (!token || typeof token !== "string") {
        res.status(400).json({ error: "Invalid or missing token." });
        return;
      }

      const tokenHash = SecurityService.hashToken(token);
      const now = new Date();

      const passwordReset = await PasswordReset.findOne({
        where: { tokenHash, usedAt: null, expiresAt: { [Op.gt]: now } },
        include: [{ model: Employee, as: "user" }],
      });

      if (!passwordReset) {
        res.status(401).json({ error: "This link is invalid or expired." });
        return;
      }

      // Compute a reasonable cookie window
      const remainingTokenMs = Math.max(
        0,
        passwordReset.expiresAt.getTime() - now.getTime()
      );
      const MAX_COOKIE_MS = 5 * 60 * 1000; // 5 min
      const cookieMs = Math.min(remainingTokenMs, MAX_COOKIE_MS);

      if (cookieMs < 5_000) {
        // avoid setting a cookie that instantly expires
        res.status(401).json({ error: "This link is invalid or expired." });
        return;
      }

      // Create & persist nonce binding
      const nonce = SecurityService.generateNonce();
      const nonceHash = SecurityService.hashToken(nonce);
      const exchangeExpiresAt = new Date(now.getTime() + cookieMs);

      await passwordReset.update({
        exchangeExpiresAt,
        exchangeNonceHash: nonceHash,
      });

      // Build cookie
      const cookieValue = SecurityService.generateCookieValue(
        passwordReset.id,
        nonce
      );

      // Decide cookie attributes based on deployment
      const isProd = process.env.NODE_ENV === "production";
      const crossSite = process.env.CROSS_SITE === "1"; // set to "1" if FE and API are on different origins

      res.cookie("pwreset", cookieValue, {
        httpOnly: true,
        secure: isProd || crossSite,
        sameSite: crossSite ? "none" : "lax",
        path: "/api/auth/reset/", // cookie sent to 'confirm' and 'status' (and any children)
        maxAge: cookieMs,
      });

      await AuditService.logFromRequest(
        req,
        AuditEventType.PW_RESET_REDEEMED,
        passwordReset.userId
      );

      res.status(200).json({
        ok: true,
        remainingSec: Math.floor(cookieMs / 1000),
        serverNow: now.getTime(),
      });
    } catch (error) {
      console.error("Token exchange error:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }

  static async activate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminUser = req.user!;

      const targetUser = await Employee.findByPk(id);
      if (!targetUser) {
        res.status(400).json({
          success: false,
          error: "User not found.",
        });
      }
      if (targetUser?.isActive) {
        res.status(400).json({
          success: false,
          error: "User is already active.",
        });
      }
      await targetUser?.update({ isActive: true });

      await AuditService.logFromRequest(
        req,
        AuditEventType.USER_ACTIVATED,
        targetUser?.id,
        adminUser.id,
        {
          targetEmail: targetUser?.email,
          reason: reason || "admin_action",
        }
      );

      res.status(200).json({
        ok: true,
        user: {
          id: targetUser?.id,
          email: targetUser?.email,
          firstName: targetUser?.firstName,
          lastName: targetUser?.lastName,
          isActive: targetUser?.isActive,
        },
      });
    } catch (error) {
      console.error("User activation error:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }

  static async deactivate(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminUser = req.user!;

      const targetUser = await Employee.findByPk(id);
      if (!targetUser) {
        res.status(400).json({
          success: false,
          error: "User not found.",
        });
      }
      if (!targetUser?.isActive) {
        res.status(400).json({
          success: false,
          error: "User is already inactive.",
        });
      }

      if (targetUser?.id === adminUser.id) {
        res.status(400).json({
          success: false,
          error: "Cannot deactivate your own account.",
        });
      }
      await targetUser?.update({ isActive: false });

      await AuditService.logFromRequest(
        req,
        AuditEventType.USER_DEACTIVATED,
        targetUser?.id,
        adminUser.id,
        {
          targetEmail: targetUser?.email,
          reason: reason || "admin_action",
        }
      );

      res.status(200).json({
        ok: true,
        user: {
          id: targetUser?.id,
          email: targetUser?.email,
          firstName: targetUser?.firstName,
          lastName: targetUser?.lastName,
          isActive: targetUser?.isActive,
        },
      });
    } catch (error) {
      console.error("User deactivation error:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const loginData: LoginRequest = req.body;
      if (!loginData.email || !loginData.password) {
        res.status(400).json({
          success: false,
          error: "Email and password are required",
        });
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
      }
      const existingUser = await Employee.findOne({
        where: { email: signUpData.email },
      });
      if (existingUser) {
        res.status(400).json({
          success: false,
          error: "An account with this email already exists.",
        });
      }

      // Secure password policy
      const pwStrength = SecurityService.validatePasswordStrength(
        signUpData.password
      );
      if (!pwStrength.valid) {
        res.status(400).json({
          success: false,
          error: pwStrength.message,
        });
      }

      const isBreached = await SecurityService.checkPasswordBreach(
        signUpData.password
      );
      if (isBreached) {
        res.status(400).json({
          success: false,
          error:
            "Please choose a stronger password. This password has been found in data breaches.",
        });
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

  static async logout(req: Request, res: Response): Promise<void> {
    await AuditService.logFromRequest(req, AuditEventType.LOGOUT, req.user?.id);
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  }

  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
      }
      const profile = await AuthService.getProfile(req?.user?.id);

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

  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Authentication required",
        });
      }
      const { currentPassword, newPassword } = req.body;
      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          error: "Current password and new password are required",
        });
      }

      // Password policy
      const pwStrength = SecurityService.validatePasswordStrength(newPassword);
      if (!pwStrength.valid) {
        res.status(400).json({
          success: false,
          error: pwStrength.message,
        });
      }

      if (await SecurityService.checkPasswordBreach(newPassword)) {
        res.status(400).json({
          success: false,
          error:
            "Please choose a stronger password. This password has been found in data breaches.",
        });
      }

      await AuthService.changePassword(
        currentPassword,
        newPassword,
        req?.user?.id
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

  static async verifyToken(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: "Invalid token",
        });
      }
      res.json({
        success: true,
        message: "Token is valid",
        data: { user: req.user },
      });
    } catch (_error: any) {
      res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    }
  }

  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        res.status(401).json({ error: "Refresh token required." });
      }
      const tokens = await AuthService.refreshAccessToken(refreshToken);

      console.log("--------------tokens---------", tokens);

      if (!tokens) {
        res.status(401).json({ error: "Invalid refresh token." });
      }
      res.status(200).json(tokens);
    } catch (error) {
      console.error("Token refresh error:", error);
      res.status(401).json({ error: "Invalid refresh token." });
    }
  }

  static async reset(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string") {
        await SecurityService.addJitter();
        res.status(200).json({
          message: "If an account exists, we sent instructions.",
        });
      }
      const normalizedEmail = email.toLowerCase().trim();
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

      const user = await Employee.findOne({
        where: { email: normalizedEmail },
      });
      if (!user) {
        await SecurityService.addJitter();
        await AuditService.logFromRequest(req, AuditEventType.PW_RESET_REQUEST);
        res.status(200).json({
          message: "If an account exists, we sent instructions.",
        });
      }

      if (
        user?.lastPasswordResetAt &&
        user.lastPasswordResetAt > fiveMinutesAgo
      ) {
        await SecurityService.addJitter();
        res.status(200).json({
          message: "If an account exists, we sent instructions.",
        });
      }

      await PasswordReset.update(
        { usedAt: new Date() },
        {
          where: {
            userId: user?.id,
            usedAt: null,
            expiresAt: { [Op.gt]: new Date() },
          },
        }
      );

      const token = SecurityService.generateToken(32);
      const tokenHash = SecurityService.hashToken(token);
      const expiryMinutes = 20;
      const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

      await PasswordReset.create({
        userId: user?.id,
        tokenHash,
        createdAt: new Date(),
        expiresAt,
        requestIp: SecurityService.ipToBuffer(req.ip || ""),
      });

      await user?.update({ lastPasswordResetAt: new Date() });

      const resetLink = `${
        process.env.FRONTEND_URL
      }/reset?token=${encodeURIComponent(token)}`;

      await new EmailService().sendResetEmail({
        user,
        resetLink,
        expiryMinutes,
        requestDetails: {
          ip: req.ip || "unknown",
          timestamp: new Date(),
          browser: req.get("User-Agent"),
        },
      });

      await AuditService.logFromRequest(
        req,
        AuditEventType.PW_RESET_REQUEST,
        user?.id,
        undefined,
        { email: normalizedEmail }
      );
      await AuditService.logFromRequest(
        req,
        AuditEventType.PW_RESET_EMAIL_SENT,
        user?.id
      );

      res.status(200).json({
        message: "If an account exists, we sent instructions.",
      });
    } catch (error) {
      console.error("Reset request error:", error);
      await SecurityService.addJitter();
      res.status(200).json({
        message: "If an account exists, we sent instructions.",
      });
    }
  }

  static async adminInitPasswordReset(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { ticketId } = req.body;
      await AuthService.adminInitPassworReset(Number(id), req, ticketId);
      res.status(200).json({ ok: true });
    } catch (error) {
      console.error("Admin reset error:", error);
      res.status(500).json({ error: "Internal server error." });
    }
  }

  public getDefaultPermissionsForRole(role: string): string[] {
    const rolePermissions = {
      admin: ["*"], // Admin has all permissions
      requester: ["create_voucher", "view_own_vouchers", "edit_voucher"],
      approver_l1: ["approve_l1", "view_department_vouchers", "reject_voucher"],
      approver_l2: ["approve_l2", "view_all_vouchers", "reject_voucher"],
      approver_l3: ["approve_l3", "view_all_vouchers", "reject_voucher"],
      finance_officer: [
        "approve_finance",
        "manage_votebook",
        "post_vouchers",
        "view_all_vouchers",
        "view_account_balances",
        "manage_budget",
      ],
      expenditure_control: [
        "expenditure_control",
        "manage_votebook",
        "view_reports",
        "view_account_balances",
        "approve_budget",
        "view_fiscal_years",
      ],
      auditor: [
        "view_audit_logs",
        "view_reports",
        "export_data",
        "view_analytics",
        "view_all_vouchers",
        "view_fiscal_years",
      ],
      // admin: [
      //   "*", // Admin has all permissions including:
      //   "manage_fiscal_years",
      //   "close_fiscal_year",
      //   "view_fiscal_years",
      // ],
    };

    return rolePermissions[role as keyof typeof rolePermissions] || [];
  }
}
