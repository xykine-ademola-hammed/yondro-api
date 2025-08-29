import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import {
  Employee,
  Department,
  Position,
  Organization,
  SchoolOrOffice,
  Unit,
} from "../models";
import {
  LoginRequest,
  SignUpRequest,
  AuthResponse,
  AuthUser,
  UserRole,
} from "../types";

export class AuthService {
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

    // Convert to plain object to avoid circular references
    const employeeData = employee.get({ plain: true });
    // Generate token
    const token = this.generateToken(employee.id);
    return {
      user: { ...employeeData },
      token,
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
      console.log("------------------------------");
      throw new Error("Invalid or expired token " + error);
    }
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string
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
  static async getProfile(userId: number): Promise<AuthUser> {
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
}
