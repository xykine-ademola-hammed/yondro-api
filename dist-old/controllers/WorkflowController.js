"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowController = void 0;
const BaseService_1 = require("../services/BaseService");
const models_1 = require("../models");
const filterWhereBuilder_1 = require("../utils/filterWhereBuilder");
class WorkflowController {
    static async createWorkflow(req, res) {
        try {
            const workflow = await WorkflowController.workflowService.create({
                ...req.body,
                createdBy: req?.user?.id,
            });
            res.status(201).json(workflow);
        }
        catch (error) {
            res.status(500).json({
                error: error.message || "Failed to create workflow",
            });
        }
    }
    static async getWorkflow(req, res) {
        try {
            const { id } = req.params;
            if (!id || isNaN(Number(id))) {
                res.status(400).json({
                    error: "Valid workflow id is required",
                });
                return;
            }
            const workflow = await WorkflowController.workflowService.findById(Number(id), {
                include: [
                    {
                        model: models_1.Stage,
                        as: "stages",
                        order: [["step", "ASC"]],
                    },
                ],
            });
            if (!workflow) {
                res.status(404).json({
                    error: "Workflow not found",
                });
                return;
            }
            res.json({
                success: true,
                data: workflow,
            });
        }
        catch (error) {
            res.status(500).json({
                error: error.message || "Failed to get workflow",
            });
        }
    }
    static async getWorkflows(req, res) {
        try {
            const { organizationId, name, description } = req.body;
            const filters = req.body.filters || [];
            const { limit, offset, search } = req.body;
            const { where } = (0, filterWhereBuilder_1.buildQueryWithIncludes)(filters);
            const result = await WorkflowController.workflowService.findWithPagination({
                page: offset ? Number(offset) : 1,
                limit: limit ? Number(limit) : 10,
                search: search,
                where,
                include: [{ model: models_1.Stage }],
                orderby: [
                    ["createdAt", "DESC"],
                    [{ model: models_1.Stage, as: "stages" }, "step", "ASC"],
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
    static async addStageToWorkflow(req, res) {
        try {
            const { id } = req.params;
            const { name, step, requiresInternalLoop, departmentId, fields } = req.body;
            if (!id || isNaN(Number(id))) {
                res.status(400).json({
                    error: "Valid workflow id is required",
                });
                return;
            }
            if (!name || !step) {
                res.status(400).json({
                    error: "name and step are required",
                });
                return;
            }
            const workflow = await WorkflowController.workflowService.findById(Number(id));
            if (!workflow) {
                res.status(404).json({
                    error: "Workflow not found",
                });
                return;
            }
            const stage = await WorkflowController.stageService.create({
                workflowId: Number(id),
                name,
                step,
                requiresInternalLoop: requiresInternalLoop || false,
                departmentId: departmentId || null,
                fields: fields || {},
            });
            res.status(201).json({
                success: true,
                data: stage,
            });
        }
        catch (error) {
            res.status(500).json({
                error: error.message || "Failed to add stage to workflow",
            });
        }
    }
    static async updateWorkflow(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            if (!id || isNaN(Number(id))) {
                res.status(400).json({
                    error: "Valid workflow id is required",
                });
                return;
            }
            const workflow = await WorkflowController.workflowService.update(Number(id), updateData);
            if (!workflow) {
                res.status(404).json({
                    error: "Workflow not found",
                });
                return;
            }
            res.json({
                success: true,
                data: workflow,
            });
        }
        catch (error) {
            res.status(500).json({
                error: error.message || "Failed to update workflow",
            });
        }
    }
    static async deleteWorkflow(req, res) {
        try {
            const { id } = req.params;
            if (!id || isNaN(Number(id))) {
                res.status(400).json({
                    error: "Valid workflow id is required",
                });
                return;
            }
            const deleted = await WorkflowController.workflowService.delete(Number(id));
            if (!deleted) {
                res.status(404).json({
                    error: "Workflow not found",
                });
                return;
            }
            res.json({
                success: true,
                message: "Workflow deleted successfully",
            });
        }
        catch (error) {
            res.status(500).json({
                error: error.message || "Failed to delete workflow",
            });
        }
    }
}
exports.WorkflowController = WorkflowController;
WorkflowController.workflowService = new BaseService_1.BaseService(models_1.Workflow);
WorkflowController.stageService = new BaseService_1.BaseService(models_1.Stage);
//# sourceMappingURL=WorkflowController.js.map