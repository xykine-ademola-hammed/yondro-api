"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationController = void 0;
const BaseService_1 = require("../services/BaseService");
const models_1 = require("../models");
class OrganizationController {
    static async create(req, res) {
        try {
            const { name, description } = req.body;
            if (!name) {
                res.status(400).json({
                    error: "name is required",
                });
                return;
            }
            const organization = await OrganizationController.organizationService.createOnly({
                name,
                description,
                isActive: true,
            });
            res.status(201).json({
                success: true,
                data: organization,
            });
        }
        catch (error) {
            res.status(500).json({
                error: error.message || "Failed to create organization",
            });
        }
    }
    static async getAll(req, res) {
        try {
            const { page, limit, search } = req.query;
            const result = await OrganizationController.organizationService.findWithPagination({
                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 10,
                search: search,
                include: [
                    {
                        model: models_1.Department,
                        as: "departments",
                        attributes: ["id", "name", "isActive"],
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
                error: error.message || "Failed to get organizations",
            });
        }
    }
    static async getById(req, res) {
        try {
            const { id } = req.params;
            if (!id || isNaN(Number(id))) {
                res.status(400).json({
                    error: "Valid organization id is required",
                });
                return;
            }
            const organization = await OrganizationController.organizationService.findById(Number(id), {
                include: [
                    {
                        model: models_1.Department,
                        as: "departments",
                    },
                ],
            });
            if (!organization) {
                res.status(404).json({
                    error: "Organization not found",
                });
                return;
            }
            res.json({
                success: true,
                data: organization,
            });
        }
        catch (error) {
            res.status(500).json({
                error: error.message || "Failed to get organization",
            });
        }
    }
    static async update(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            if (!id || isNaN(Number(id))) {
                res.status(400).json({
                    error: "Valid organization id is required",
                });
                return;
            }
            const organization = await OrganizationController.organizationService.update(Number(id), updateData);
            if (!organization) {
                res.status(404).json({
                    error: "Organization not found",
                });
                return;
            }
            res.json({
                success: true,
                data: organization,
            });
        }
        catch (error) {
            res.status(500).json({
                error: error.message || "Failed to update organization",
            });
        }
    }
    static async delete(req, res) {
        try {
            const { id } = req.params;
            if (!id || isNaN(Number(id))) {
                res.status(400).json({
                    error: "Valid organization id is required",
                });
                return;
            }
            const deleted = await OrganizationController.organizationService.delete(Number(id));
            if (!deleted) {
                res.status(404).json({
                    error: "Organization not found",
                });
                return;
            }
            res.json({
                success: true,
                message: "Organization deleted successfully",
            });
        }
        catch (error) {
            res.status(500).json({
                error: error.message || "Failed to delete organization",
            });
        }
    }
}
exports.OrganizationController = OrganizationController;
OrganizationController.organizationService = new BaseService_1.BaseService(models_1.Organization);
//# sourceMappingURL=OrganizationController.js.map