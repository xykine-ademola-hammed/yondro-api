"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolOrOfficeController = void 0;
const BaseService_1 = require("../services/BaseService");
const models_1 = require("../models");
const filterWhereBuilder_1 = require("../utils/filterWhereBuilder");
class SchoolOrOfficeController {
    static async create(req, res) {
        try {
            const { organizationId, name, description, units, financeCode } = req.body;
            if (!organizationId || !name) {
                res.status(400).json({
                    error: "organizationId and name are required",
                });
                return;
            }
            const schoolOrOffice = await SchoolOrOfficeController.schoolOrOfficeService.createOnly({
                organizationId: Number(organizationId),
                name,
                description,
                isActive: true,
                financeCode: financeCode,
            });
            for (let unit of units) {
                for (let subUnit of unit.subUnits) {
                }
            }
            res.status(201).json({
                success: true,
                data: schoolOrOffice,
            });
        }
        catch (error) {
            res.status(500).json({
                error: error.message || "Failed to create schoolOrOffice",
            });
        }
    }
    static async getSchoolOrOffices(req, res) {
        try {
            const filters = req.body.filters || [];
            const { limit, offset, search } = req.body;
            const where = (0, filterWhereBuilder_1.buildWhereClause)(filters);
            const result = await SchoolOrOfficeController.schoolOrOfficeService.findWithPagination({
                page: offset ? Number(offset) : 1,
                limit: limit ? Number(limit) : 10,
                search: search,
                where,
                include: [
                    models_1.Position,
                    {
                        model: models_1.Organization,
                        as: "organization",
                    },
                    {
                        model: models_1.Department,
                        as: "departments",
                        include: [
                            {
                                model: models_1.Unit,
                                as: "units",
                            },
                            {
                                model: models_1.Position,
                                as: "positions",
                            },
                        ],
                    },
                ],
            });
            res.json(result);
        }
        catch (error) {
            res.status(500).json({
                error: error.message || "Failed to create schoolOrOffice",
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
            const result = await SchoolOrOfficeController.schoolOrOfficeService.findWithPagination({
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
                        model: models_1.Department,
                        as: "departments",
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
                error: error.message || "Failed to get schoolOrOffices",
            });
        }
    }
    static async getById(req, res) {
        try {
            const { id } = req.params;
            if (!id || isNaN(Number(id))) {
                res.status(400).json({
                    error: "Valid schoolOrOffice id is required",
                });
                return;
            }
            const schoolOrOffice = await SchoolOrOfficeController.schoolOrOfficeService.findById(Number(id), {
                include: [
                    {
                        model: models_1.Organization,
                        as: "organization",
                    },
                    {
                        model: models_1.Department,
                        as: "departments",
                        include: [
                            {
                                model: models_1.Position,
                                as: "position",
                            },
                        ],
                    },
                ],
            });
            if (!schoolOrOffice) {
                res.status(404).json({
                    error: "SchoolOrOffice not found",
                });
                return;
            }
            res.json({
                success: true,
                data: schoolOrOffice,
            });
        }
        catch (error) {
            res.status(500).json({
                error: error.message || "Failed to get schoolOrOffice",
            });
        }
    }
    static async update(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            if (!id || isNaN(Number(id))) {
                res.status(400).json({
                    error: "Valid schoolOrOffice id is required",
                });
                return;
            }
            const schoolOrOffice = await SchoolOrOfficeController.schoolOrOfficeService.update(Number(id), updateData);
            if (!schoolOrOffice) {
                res.status(404).json({
                    error: "SchoolOrOffice not found",
                });
                return;
            }
            res.json({
                success: true,
                data: schoolOrOffice,
            });
        }
        catch (error) {
            res.status(500).json({
                error: error.message || "Failed to update schoolOrOffice",
            });
        }
    }
    static async delete(req, res) {
        try {
            const { id } = req.params;
            if (!id || isNaN(Number(id))) {
                res.status(400).json({
                    error: "Valid schoolOrOffice id is required",
                });
                return;
            }
            const deleted = await SchoolOrOfficeController.schoolOrOfficeService.delete(Number(id));
            if (!deleted) {
                res.status(404).json({
                    error: "SchoolOrOffice not found",
                });
                return;
            }
            res.json({
                success: true,
                message: "SchoolOrOffice deleted successfully",
            });
        }
        catch (error) {
            res.status(500).json({
                error: error.message || "Failed to delete schoolOrOffice",
            });
        }
    }
}
exports.SchoolOrOfficeController = SchoolOrOfficeController;
SchoolOrOfficeController.schoolOrOfficeService = new BaseService_1.BaseService(models_1.SchoolOrOffice);
//# sourceMappingURL=SchoolOfficeController.js.map