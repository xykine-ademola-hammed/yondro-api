"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PositionController = void 0;
const BaseService_1 = require("../services/BaseService");
const models_1 = require("../models");
const sequelize_1 = require("sequelize");
const filterWhereBuilder_1 = require("../utils/filterWhereBuilder");
class PositionController {
    static async create(req, res) {
        try {
            const { organizationId, departmentId, schoolOrOfficeId, unitId, parentPositionId, title, description, } = req.body;
            if (!organizationId || !title) {
                res.status(400).json({
                    success: false,
                    error: "organizationId and title are required",
                });
                return;
            }
            const position = await PositionController.positionService.createOnly({
                organizationId,
                departmentId,
                schoolOrOfficeId,
                unitId,
                parentPositionId,
                title,
                description,
                isActive: true,
            });
            res.status(201).json({
                success: true,
                data: position,
            });
        }
        catch (error) {
            console.log("=======  Error creating position:", error);
            res.status(500).json({
                success: false,
                error: error.message || "Failed to create position",
            });
        }
    }
    static async getPositions(req, res) {
        try {
            const filters = req.body.filters || [];
            const { limit, offset, search } = req.body;
            const { where } = (0, filterWhereBuilder_1.buildQueryWithIncludes)(filters);
            const result = await PositionController.positionService.findWithPagination({
                page: offset ? Number(offset) : 1,
                limit: limit ? Number(limit) : 10,
                search: search,
                where,
                include: [models_1.Department, models_1.SchoolOrOffice],
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
            const { page, limit, search, organizationId, departmentId } = req.query;
            let where = {};
            if (organizationId) {
                where.organizationId = Number(organizationId);
            }
            if (departmentId) {
                where.departmentId = Number(departmentId);
            }
            let searchWhere = where;
            if (search) {
                searchWhere = {
                    ...where,
                    [sequelize_1.Op.or]: [
                        { title: { [sequelize_1.Op.like]: `%${search}%` } },
                        { description: { [sequelize_1.Op.like]: `%${search}%` } },
                    ],
                };
            }
            const result = await PositionController.positionService.findWithPagination({
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 10,
                where: searchWhere,
                include: [
                    {
                        model: models_1.Organization,
                        as: "organization",
                        attributes: ["id", "name"],
                    },
                    {
                        model: models_1.Department,
                        as: "department",
                        attributes: ["id", "name"],
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
                success: false,
                error: error.message || "Failed to get positions",
            });
        }
    }
    static async getById(req, res) {
        try {
            const { id } = req.params;
            if (!id || isNaN(Number(id))) {
                res.status(400).json({
                    success: false,
                    error: "Valid position id is required",
                });
                return;
            }
            const position = await PositionController.positionService.findById(Number(id), {
                include: [
                    {
                        model: models_1.Organization,
                        as: "organization",
                    },
                    {
                        model: models_1.Department,
                        as: "department",
                    },
                ],
            });
            if (!position) {
                res.status(404).json({
                    success: false,
                    error: "Position not found",
                });
                return;
            }
            res.json({
                success: true,
                data: position,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message || "Failed to get position",
            });
        }
    }
    static async update(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            if (!id || isNaN(Number(id))) {
                res.status(400).json({
                    success: false,
                    error: "Valid position id is required",
                });
                return;
            }
            const position = await PositionController.positionService.update(Number(id), updateData);
            if (!position) {
                res.status(404).json({
                    success: false,
                    error: "Position not found",
                });
                return;
            }
            res.json({
                success: true,
                data: position,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message || "Failed to update position",
            });
        }
    }
    static async delete(req, res) {
        try {
            const { id } = req.params;
            if (!id || isNaN(Number(id))) {
                res.status(400).json({
                    success: false,
                    error: "Valid position id is required",
                });
                return;
            }
            const deleted = await PositionController.positionService.delete(Number(id));
            if (!deleted) {
                res.status(404).json({
                    success: false,
                    error: "Position not found",
                });
                return;
            }
            res.json({
                success: true,
                message: "Position deleted successfully",
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                error: error.message || "Failed to delete position",
            });
        }
    }
}
exports.PositionController = PositionController;
PositionController.positionService = new BaseService_1.BaseService(models_1.Position);
//# sourceMappingURL=PositionController.js.map