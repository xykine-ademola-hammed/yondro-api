"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const models_1 = require("../models");
const types_1 = require("../types");
class AuthService {
    static generateToken(userId) {
        const payload = { userId };
        const options = { expiresIn: Number(this.JWT_EXPIRES_IN) };
        return jsonwebtoken_1.default.sign(payload, this.JWT_SECRET, options);
    }
    static toAuthUser(employee) {
        return {
            id: employee.id,
            email: employee.email,
            firstName: employee.firstName,
            lastName: employee.lastName,
            departmentId: employee?.departmentId,
            positionId: employee.positionId,
            role: employee.role,
            department: employee.department,
            position: employee.position,
        };
    }
    static async login(loginData) {
        const { email, password } = loginData;
        const employee = await models_1.Employee.findOne({
            where: {
                email: email.toLowerCase(),
                isActive: true,
            },
            include: [models_1.Organization, models_1.Department, models_1.Position, models_1.Unit],
        });
        if (!employee) {
            throw new Error("Invalid email or password");
        }
        const isPasswordValid = await bcryptjs_1.default.compare(password, employee.password);
        if (!isPasswordValid) {
            throw new Error("Invalid password");
        }
        const employeeData = employee.get({ plain: true });
        const token = this.generateToken(employee.id);
        return {
            user: { ...employeeData },
            token,
            expiresIn: this.JWT_EXPIRES_IN,
        };
    }
    static async signUp(signUpData) {
        const { email, password, firstName, lastName, departmentId, positionId, role, organizationId, } = signUpData;
        const existingEmployee = await models_1.Employee.findOne({
            where: { email: email.toLowerCase() },
        });
        if (existingEmployee) {
            throw new Error("User with this email already exists");
        }
        const department = await models_1.Department.findByPk(departmentId);
        if (!department) {
            throw new Error("Invalid department");
        }
        const position = await models_1.Position.findByPk(positionId);
        if (!position) {
            throw new Error("Invalid position");
        }
        const employee = await models_1.Employee.create({
            email: email.toLowerCase(),
            password,
            firstName,
            lastName,
            departmentId,
            positionId,
            organizationId,
            role: role || types_1.UserRole.EMPLOYEE,
            isActive: true,
        });
        const createdEmployee = await models_1.Employee.findByPk(employee.id, {
            include: [
                {
                    model: models_1.Department,
                    as: "department",
                    attributes: ["id", "name"],
                },
                {
                    model: models_1.Position,
                    as: "position",
                    attributes: ["id", "title"],
                },
            ],
        });
        if (!createdEmployee) {
            throw new Error("Failed to create user");
        }
        const token = this.generateToken(createdEmployee.id);
        return {
            user: this.toAuthUser(createdEmployee),
            token,
            expiresIn: this.JWT_EXPIRES_IN,
        };
    }
    static async verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.JWT_SECRET);
            const employee = await models_1.Employee.findOne({
                where: { isActive: true, id: decoded.userId },
                include: [
                    {
                        model: models_1.SchoolOrOffice,
                        as: "schoolOrOffice",
                        attributes: ["id", "name", "financeCode"],
                    },
                    {
                        model: models_1.Department,
                        as: "department",
                        attributes: ["id", "name", "financeCode"],
                    },
                    {
                        model: models_1.Unit,
                        as: "unit",
                        attributes: ["id", "name", "financeCode"],
                    },
                    {
                        model: models_1.Position,
                        as: "position",
                        attributes: ["id", "title", "hierarchyLevel"],
                    },
                ],
            });
            if (!employee) {
                throw new Error("User not found");
            }
            return this.toAuthUser(employee);
        }
        catch (error) {
            console.log("------------------------------");
            throw new Error("Invalid or expired token " + error);
        }
    }
    static async changePassword(userId, currentPassword, newPassword) {
        const employee = await models_1.Employee.findByPk(userId);
        if (!employee) {
            throw new Error("User not found");
        }
        const isCurrentPasswordValid = await bcryptjs_1.default.compare(currentPassword, employee.password);
        if (!isCurrentPasswordValid) {
            throw new Error("Current password is incorrect");
        }
        await employee.update({ password: newPassword });
    }
    static async getProfile(userId) {
        const employee = await models_1.Employee.findOne({
            where: { isActive: true, id: userId },
            include: [
                {
                    model: models_1.Department,
                    as: "department",
                    attributes: ["id", "name"],
                },
                {
                    model: models_1.Position,
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
exports.AuthService = AuthService;
AuthService.JWT_SECRET = process.env.JWT_SECRET || "your-super-secret-jwt-key";
AuthService.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
//# sourceMappingURL=AuthService.js.map