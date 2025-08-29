"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeController = void 0;
const BaseService_1 = require("../services/BaseService");
const models_1 = require("../models");
const sequelize_1 = require("sequelize");
const filterWhereBuilder_1 = require("../utils/filterWhereBuilder");
class EmployeeController {
    static async create(req, res) {
        try {
            const { departmentId, organizationId, positionId, schoolOrOfficeId, unitId, firstName, lastName, email, phone, password, role, } = req.body;
            if (!positionId ||
                !firstName ||
                !lastName ||
                !email ||
                !organizationId ||
                !password) {
                res.status(400).json({
                    error: "positionId, firstName, lastName, email, and password are required",
                });
                return;
            }
            const employee = await EmployeeController.employeeService.createOnly({
                departmentId,
                organizationId,
                positionId,
                firstName,
                lastName,
                schoolOrOfficeId,
                unitId,
                email,
                phone,
                password,
                role: role || "Employee",
                isActive: true,
            });
            res.status(201).json({
                success: true,
                data: employee,
            });
        }
        catch (error) {
            res.status(500).json({
                error: error.message || "Failed to create employee",
            });
        }
    }
    static async getEmployees(req, res) {
        try {
            const { organizationId, name, description } = req.body;
            const filters = req.body.filters || [];
            const { limit, offset, search } = req.body;
            const { where, include } = (0, filterWhereBuilder_1.buildQueryWithIncludes)(filters, models_1.Position);
            const result = await EmployeeController.employeeService.findWithPagination({
                page: offset ? Number(offset) : 1,
                limit: limit ? Number(limit) : 10,
                search: search,
                where,
                include: [
                    { model: models_1.Department, as: "department", include: [models_1.Unit] },
                    models_1.Position,
                    ...include,
                ],
            });
            res.json(result);
        }
        catch (error) {
            res.status(500).json({
                error: error.message || "Failed to create department",
            });
        }
    }
    static async getAll(req, res) {
        try {
            const { page, limit, search, departmentId } = req.query;
            let where = {};
            if (departmentId) {
                where = { departmentId: Number(departmentId) };
            }
            let searchWhere = where;
            if (search) {
                searchWhere = {
                    ...where,
                    [sequelize_1.Op.or]: [
                        { firstName: { [sequelize_1.Op.like]: `%${search}%` } },
                        { lastName: { [sequelize_1.Op.like]: `%${search}%` } },
                        { email: { [sequelize_1.Op.like]: `%${search}%` } },
                    ],
                };
            }
            const result = await EmployeeController.employeeService.findWithPagination({
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 10,
                where: searchWhere,
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
            res.json({
                success: true,
                ...result,
            });
        }
        catch (error) {
            res.status(500).json({
                error: error.message || "Failed to get employees",
            });
        }
    }
    static async getById(req, res) {
        try {
            const { id } = req.params;
            if (!id || isNaN(Number(id))) {
                res.status(400).json({
                    error: "Valid employee id is required",
                });
                return;
            }
            const employee = await EmployeeController.employeeService.findById(Number(id), {
                include: [
                    {
                        model: models_1.Department,
                        as: "department",
                    },
                    {
                        model: models_1.Position,
                        as: "position",
                    },
                ],
            });
            if (!employee) {
                res.status(404).json({
                    error: "Employee not found",
                });
                return;
            }
            res.json({
                success: true,
                data: employee,
            });
        }
        catch (error) {
            res.status(500).json({
                error: error.message || "Failed to get employee",
            });
        }
    }
    static async update(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            if (!id || isNaN(Number(id))) {
                res.status(400).json({
                    error: "Valid employee id is required",
                });
                return;
            }
            const employee = await EmployeeController.employeeService.update(Number(id), updateData);
            if (!employee) {
                res.status(404).json({
                    error: "Employee not found",
                });
                return;
            }
            res.json({
                success: true,
                data: employee,
            });
        }
        catch (error) {
            res.status(500).json({
                error: error.message || "Failed to update employee",
            });
        }
    }
    static async delete(req, res) {
        try {
            const { id } = req.params;
            if (!id || isNaN(Number(id))) {
                res.status(400).json({
                    error: "Valid employee id is required",
                });
                return;
            }
            const deleted = await EmployeeController.employeeService.delete(Number(id));
            if (!deleted) {
                res.status(404).json({
                    error: "Employee not found",
                });
                return;
            }
            res.json({
                success: true,
                message: "Employee deleted successfully",
            });
        }
        catch (error) {
            res.status(500).json({
                error: error.message || "Failed to delete employee",
            });
        }
    }
}
exports.EmployeeController = EmployeeController;
EmployeeController.employeeService = new BaseService_1.BaseService(models_1.Employee);
//# sourceMappingURL=EmployeeController.js.map