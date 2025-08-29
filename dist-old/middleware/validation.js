"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.signUpSchema = exports.loginSchema = exports.employeeSchema = exports.positionSchema = exports.departmentSchema = exports.organizationSchema = exports.stageCompletionSchema = exports.workflowRequestSchema = exports.validateRequest = void 0;
const joi_1 = __importDefault(require("joi"));
const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body);
        if (error) {
            res.status(400).json({
                success: false,
                error: "Validation error",
                details: error.details.map((detail) => detail.message),
            });
            return;
        }
        next();
    };
};
exports.validateRequest = validateRequest;
exports.workflowRequestSchema = joi_1.default.object({
    workflowId: joi_1.default.number().integer().positive().required(),
    requestorId: joi_1.default.number().integer().positive().required(),
});
exports.stageCompletionSchema = joi_1.default.object({
    stageId: joi_1.default.number().integer().positive().required(),
    action: joi_1.default.string().valid("approve", "reject").required(),
    actedByUserId: joi_1.default.number().integer().positive().required(),
    comment: joi_1.default.string().optional(),
    fieldResponses: joi_1.default.object().optional(),
});
exports.organizationSchema = joi_1.default.object({
    name: joi_1.default.string().min(1).max(255).required(),
    description: joi_1.default.string().optional(),
    isActive: joi_1.default.boolean().optional(),
});
exports.departmentSchema = joi_1.default.object({
    organizationId: joi_1.default.number().integer().positive().required(),
    name: joi_1.default.string().min(1).max(255).required(),
    description: joi_1.default.string().optional(),
    isActive: joi_1.default.boolean().optional(),
});
exports.positionSchema = joi_1.default.object({
    organizationId: joi_1.default.number().integer().positive().required(),
    departmentId: joi_1.default.number().integer().positive().required(),
    title: joi_1.default.string().min(1).max(255).required(),
    description: joi_1.default.string().optional(),
    isActive: joi_1.default.boolean().optional(),
});
exports.employeeSchema = joi_1.default.object({
    departmentId: joi_1.default.number().integer().positive().required(),
    positionId: joi_1.default.number().integer().positive().required(),
    firstName: joi_1.default.string().min(1).max(100).required(),
    lastName: joi_1.default.string().min(1).max(100).required(),
    email: joi_1.default.string().email().required(),
    phone: joi_1.default.string().optional(),
    isActive: joi_1.default.boolean().optional(),
});
exports.loginSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(6).required(),
});
exports.signUpSchema = joi_1.default.object({
    email: joi_1.default.string().email().required(),
    password: joi_1.default.string().min(6).required(),
    firstName: joi_1.default.string().min(1).max(100).required(),
    lastName: joi_1.default.string().min(1).max(100).required(),
    departmentId: joi_1.default.number().integer().positive().required(),
    positionId: joi_1.default.number().integer().positive().required(),
    organizationId: joi_1.default.number().integer().positive().required(),
    role: joi_1.default.string().valid("Admin", "Manager", "Employee").optional(),
});
exports.changePasswordSchema = joi_1.default.object({
    currentPassword: joi_1.default.string().required(),
    newPassword: joi_1.default.string().min(6).required(),
});
//# sourceMappingURL=validation.js.map