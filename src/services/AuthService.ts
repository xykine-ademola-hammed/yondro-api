import bcrypt from "bcryptjs";
import { Request } from "express";
import { hash, verify } from "@node-rs/argon2";
import jwt, { SignOptions } from "jsonwebtoken";
import {
  Employee,
  Department,
  Position,
  Organization,
  SchoolOrOffice,
  Unit,
  PasswordReset,
} from "../models";
import {
  LoginRequest,
  SignUpRequest,
  AuthResponse,
  AuthUser,
  UserRole,
} from "../types";
import { Op } from "sequelize";
import { SecurityService } from "./SecurityService";
import { EmailService } from "./EmailService";
import { AuditEventType, AuditService } from "./AuditService";

export interface TokenPayload {
  userId: number;
  email: string;
  exp: number;
  iat: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  expiresAt: number;
}

export class AuthService {
  private static emailService = new EmailService();
  private static readonly JWT_SECRET: jwt.Secret =
    process.env.JWT_SECRET || "your-super-secret-jwt-key";
  private static readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

  /**
   * Generate JWT token for user
   */
  private static generateToken(userId: number): string {
    // Payload should be an object; secret should match the Secret type; options uses expiresIn
    const payload = { userId };
    const options: SignOptions = { expiresIn: Number(this.JWT_EXPIRES_IN) };
    return jwt.sign(payload, this.JWT_SECRET, options);
  }

  private static readonly ACCESS_TOKEN_EXPIRY = 30 * 60; // 15 minutes
  private static readonly REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 days

  static generateTokens(user: Employee): AuthTokens {
    const now = Math.floor(Date.now() / 1000);
    const accessTokenExp = now + this.ACCESS_TOKEN_EXPIRY;
    const refreshTokenExp = now + this.REFRESH_TOKEN_EXPIRY;

    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        exp: accessTokenExp,
        iat: now,
      },
      process.env.JWT_SECRET!
    );

    const refreshToken = jwt.sign(
      {
        userId: user.id,
        type: "refresh",
        exp: refreshTokenExp,
        iat: now,
      },
      process.env.JWT_SECRET!
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.ACCESS_TOKEN_EXPIRY,
      expiresAt: accessTokenExp * 1000, // Convert to milliseconds
    };
  }

  /**
   * Convert Employee model to AuthUser
   */
  private static toAuthUser(employee: Employee): AuthUser {
    return {
      id: employee.id,
      email: employee.email,
      firstName: employee.firstName,
      lastName: employee.lastName,
      departmentId: employee?.departmentId,
      positionId: employee.positionId,
      role: employee.role as UserRole,
      department: employee.department,
      position: employee.position,
      organizationId: employee.organizationId,
      permissions: employee.permissions,
    };
  }

  /**
   * User login
   */
  static async login(loginData: LoginRequest): Promise<any> {
    const { email, password } = loginData;
    // Find user by email
    const employee = await Employee.findOne({
      where: {
        email: email.toLowerCase(),
        isActive: true,
      },
      include: [Organization, Department, Position, Unit],
    });

    if (!employee) {
      throw new Error("Invalid email or password");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, employee.password);
    if (!isPasswordValid) {
      throw new Error("Invalid password");
    }

    if (!employee.isActive) {
      throw new Error("Account is deactivated. Please contact support.");
    }

    // Convert to plain object to avoid circular references
    const employeeData = employee.get({ plain: true });
    // Generate token
    const tokens = this.generateTokens(employee);
    return {
      user: { ...employeeData },
      tokens,
      expiresIn: this.JWT_EXPIRES_IN,
    };
  }

  /**
   * User signup
   */
  static async signUp(signUpData: SignUpRequest): Promise<AuthResponse> {
    const {
      email,
      password,
      firstName,
      lastName,
      departmentId,
      positionId,
      role,
      organizationId,
    } = signUpData;

    // Check if user already exists
    const existingEmployee = await Employee.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingEmployee) {
      throw new Error("User with this email already exists");
    }

    // Verify department and position exist
    const department = await Department.findByPk(departmentId);
    if (!department) {
      throw new Error("Invalid department");
    }

    const position = await Position.findByPk(positionId);
    if (!position) {
      throw new Error("Invalid position");
    }

    // Create new employee
    const employee = await Employee.create({
      email: email.toLowerCase(),
      password,
      firstName,
      lastName,
      departmentId,
      positionId,
      organizationId,
      role: role || UserRole.EMPLOYEE,
      isActive: true,
    });

    // Fetch created employee with associations
    const createdEmployee = await Employee.findByPk(employee.id, {
      include: [
        {
          model: Department,
          as: "department",
          attributes: ["id", "name"],
        },
        {
          model: Position,
          as: "position",
          attributes: ["id", "title"],
        },
      ],
    });

    if (!createdEmployee) {
      throw new Error("Failed to create user");
    }

    // Generate token
    const token = this.generateToken(createdEmployee.id);

    return {
      user: this.toAuthUser(createdEmployee),
      token,
      expiresIn: this.JWT_EXPIRES_IN,
    };
  }

  /**
   * Verify JWT token and get user
   */
  static async verifyToken(token: string): Promise<AuthUser> {
    try {
      const decoded = jwt.verify(token, this.JWT_SECRET) as { userId: number };

      const employee = await Employee.findOne({
        where: { isActive: true, id: decoded.userId },
        include: [
          {
            model: SchoolOrOffice,
            as: "schoolOrOffice",
            attributes: ["id", "name", "financeCode"],
          },
          {
            model: Department,
            as: "department",
            attributes: ["id", "name", "financeCode"],
          },
          {
            model: Unit,
            as: "unit",
            attributes: ["id", "name", "financeCode"],
          },
          {
            model: Position,
            as: "position",
            attributes: ["id", "title", "hierarchyLevel"],
          },
        ],
      });

      if (!employee) {
        throw new Error("User not found");
      }

      return this.toAuthUser(employee);
    } catch (error) {
      throw new Error("Invalid or expired token " + error);
    }
  }

  /**
   * Change user password
   */
  static async changePassword(
    currentPassword: string,
    newPassword: string,
    userId?: number
  ): Promise<void> {
    const employee = await Employee.findByPk(userId);

    if (!employee) {
      throw new Error("User not found");
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      employee.password
    );
    if (!isCurrentPasswordValid) {
      throw new Error("Current password is incorrect");
    }

    // Update password (will be hashed by the beforeUpdate hook)
    await employee.update({ password: newPassword });
  }

  /**
   * Get user profile
   */
  static async getProfile(userId?: number): Promise<AuthUser> {
    const employee = await Employee.findOne({
      where: { isActive: true, id: userId },
      include: [
        {
          model: Department,
          as: "department",
          attributes: ["id", "name"],
        },
        {
          model: Position,
          as: "position",
          attributes: ["id", "title"],
        },
      ],
    });

    if (!employee) {
      throw new Error("User not found");
    }

    return this.toAuthUser(employee);
  }

  static async verifyPassword(
    user: Employee,
    password: string
  ): Promise<boolean> {
    try {
      return await verify(user.password, password);
    } catch (error) {
      return false;
    }
  }

  static async hashPassword(password: string): Promise<string> {
    const params = {
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
      type: 2 as const,
    }; // Argon2id
    return hash(password, params);
  }

  static async refreshAccessToken(
    refreshToken: string
  ): Promise<AuthTokens | null> {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET!) as {
        userId: number;
        type: string;
        exp: number;
      };

      if (decoded.type !== "refresh") {
        return null;
      }

      const employee = await Employee.findByPk(decoded.userId);
      if (!employee) {
        return null;
      }

      return this.generateTokens(employee);
    } catch (error) {
      return null;
    }
  }

  static getTokenExpiration(token: string): number | null {
    try {
      const decoded = jwt.decode(token) as TokenPayload;
      return decoded.exp * 1000; // Convert to milliseconds
    } catch (error) {
      return null;
    }
  }

  static async adminInitPassworReset(
    employeeId: number,
    req: Request,
    ticketId: string
  ) {
    try {
      const targetUser = await Employee.findByPk(employeeId);
      if (!targetUser) {
        throw new Error("User not found.");
      }

      // Mark any existing valid tokens as used
      await PasswordReset.update(
        { used_at: new Date() },
        {
          where: {
            user_id: targetUser.id,
            used_at: null,
            expires_at: { [Op.gt]: new Date() },
          },
        }
      );

      // Generate new token
      const token = this.generateToken(employeeId);
      const tokenHash = SecurityService.hashToken(token);
      const expiryMinutes = 20;
      const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

      await PasswordReset.create({
        userId: targetUser.id,
        tokenHash: tokenHash,
        createdAt: new Date(),
        expiresAt: expiresAt,
        requestIp: SecurityService.ipToBuffer(req.ip || ""),
      });

      // Send email
      const resetLink = `${
        process.env.FRONTEND_URL
      }/reset?token=${encodeURIComponent(token)}`;

      await this.emailService.sendResetEmail({
        user: targetUser,
        resetLink,
        expiryMinutes,
        requestDetails: {
          ip: req.ip || "unknown",
          timestamp: new Date(),
          browser: req.get("User-Agent"),
        },
      });

      // Log admin-initiated reset
      await AuditService.logFromRequest(
        req,
        AuditEventType.ADMIN_RESET_INITIATED,
        targetUser.id,
        req?.user?.id,
        { ticketId, targetEmail: targetUser.email }
      );
    } catch (e) {}
  }
}
