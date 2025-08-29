"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentController = void 0;
const BaseService_1 = require("../services/BaseService");
const models_1 = require("../models");
const filterWhereBuilder_1 = require("../utils/filterWhereBuilder");
class DepartmentController {
    static async create(req, res) {
        try {
            const { organizationId, name, description, units, financeCode } = req.body;
            if (!organizationId || !name) {
                res.status(400).json({
                    error: "organizationId and name are required",
                });
                return;
            }
            const department = await DepartmentController.departmentService.createOnly({
                organizationId: Number(organizationId),
                name,
                description,
                isActive: true,
                hasUnits: !!units.length,
                financeCode: financeCode,
            });
            for (let unit of units) {
                for (let subUnit of unit.subUnits) {
                }
            }
            res.status(201).json({
                success: true,
                data: department,
            });
        }
        catch (error) {
            res.status(500).json({
                error: error.message || "Failed to create department",
            });
        }
    }
    static async getDepartments(req, res) {
        try {
            const { organizationId, name, description } = req.body;
            const filters = req.body.filters || [];
            const { limit, offset, search } = req.body;
            const where = (0, filterWhereBuilder_1.buildWhereClause)(filters);
            const result = await DepartmentController.departmentService.findWithPagination({
                page: offset ? Number(offset) : 1,
                limit: limit ? Number(limit) : 10,
                search: search,
                where,
                include: [
                    {
                        model: models_1.Organization,
                        as: "organization",
                        attributes: ["id", "name"],
                    },
                    {
                        model: models_1.Employee,
                        as: "employees",
                        attributes: ["id", "firstName", "lastName", "isActive"],
                    },
                    {
                        model: models_1.Unit,
                        as: "units",
                    },
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
            const { page, limit, search, organizationId } = req.query;
            let where = {};
            if (organizationId) {
                where = { organizationId: Number(organizationId) };
            }
            const result = await DepartmentController.departmentService.findWithPagination({
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 10,
                search: search,
                where,
                include: [
                    {
                        model: models_1.Organization,
                        as: "organization",
                        attributes: ["id", "name"],
                    },
                    {
                        model: models_1.Employee,
                        as: "employees",
                        attributes: ["id", "firstName", "lastName", "isActive"],
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
                error: error.message || "Failed to get departments",
            });
        }
    }
    static async getById(req, res) {
        try {
            const { id } = req.params;
            if (!id || isNaN(Number(id))) {
                res.status(400).json({
                    error: "Valid department id is required",
                });
                return;
            }
            const department = await DepartmentController.departmentService.findById(Number(id), {
                include: [
                    {
                        model: models_1.Organization,
                        as: "organization",
                    },
                    {
                        model: models_1.Employee,
                        as: "employees",
                        include: [
                            {
                                model: models_1.Position,
                                as: "position",
                            },
                        ],
                    },
                ],
            });
            if (!department) {
                res.status(404).json({
                    error: "Department not found",
                });
                return;
            }
            res.json({
                success: true,
                data: department,
            });
        }
        catch (error) {
            res.status(500).json({
                error: error.message || "Failed to get department",
            });
        }
    }
    static async update(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            if (!id || isNaN(Number(id))) {
                res.status(400).json({
                    error: "Valid department id is required",
                });
                return;
            }
            const department = await DepartmentController.departmentService.update(Number(id), updateData);
            if (!department) {
                res.status(404).json({
                    error: "Department not found",
                });
                return;
            }
            res.json({
                success: true,
                data: department,
            });
        }
        catch (error) {
            res.status(500).json({
                error: error.message || "Failed to update department",
            });
        }
    }
    static async delete(req, res) {
        try {
            const { id } = req.params;
            if (!id || isNaN(Number(id))) {
                res.status(400).json({
                    error: "Valid department id is required",
                });
                return;
            }
            const deleted = await DepartmentController.departmentService.delete(Number(id));
            if (!deleted) {
                res.status(404).json({
                    error: "Department not found",
                });
                return;
            }
            res.json({
                success: true,
                message: "Department deleted successfully",
            });
        }
        catch (error) {
            res.status(500).json({
                error: error.message || "Failed to delete department",
            });
        }
    }
}
exports.DepartmentController = DepartmentController;
DepartmentController.departmentService = new BaseService_1.BaseService(models_1.Department);
//# sourceMappingURL=DepartmentController.js.map