import { Request, Response, NextFunction } from "express";
import Joi from "joi";

export const validateRequest = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
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

// Common validation schemas
export const workflowRequestSchema = Joi.object({
  workflowId: Joi.number().integer().positive().required(),
  requestorId: Joi.number().integer().positive().required(),
});

export const stageCompletionSchema = Joi.object({
  stageId: Joi.number().integer().positive().required(),
  action: Joi.string().valid("approve", "reject").required(),
  actedByUserId: Joi.number().integer().positive().required(),
  comment: Joi.string().optional(),
  fieldResponses: Joi.object().optional(),
});

export const organizationSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
});

export const departmentSchema = Joi.object({
  organizationId: Joi.number().integer().positive().required(),
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
});

export const positionSchema = Joi.object({
  organizationId: Joi.number().integer().positive().required(),
  departmentId: Joi.number().integer().positive().required(),
  title: Joi.string().min(1).max(255).required(),
  description: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
});

export const employeeSchema = Joi.object({
  departmentId: Joi.number().integer().positive().required(),
  positionId: Joi.number().integer().positive().required(),
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const signUpSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  departmentId: Joi.number().integer().positive().required(),
  positionId: Joi.number().integer().positive().required(),
  organizationId: Joi.number().integer().positive().required(),
  role: Joi.string().valid("Admin", "Manager", "Employee").optional(),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).required(),
});
