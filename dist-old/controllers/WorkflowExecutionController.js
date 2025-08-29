"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowExecutionController = void 0;
const WorkflowExecutionService_1 = require("../services/WorkflowExecutionService");
const filterWhereBuilder_1 = require("../utils/filterWhereBuilder");
const models_1 = require("../models");
const BaseService_1 = require("../services/BaseService");
class WorkflowExecutionController {
    static async startWorkflowRequest(req, res) {
        try {
            const { workflowId, requestorId, formResponses } = req.body;
            const actedByUserId = req.user?.id;
            if (!workflowId || !requestorId) {
                res.status(400).json({
                    error: "workflowId !requestorId is required",
                });
                return;
            }
            console.log("=================USER=====", req.user);
            const workflowRequest = await WorkflowExecutionService_1.WorkflowExecutionService.startWorkflowRequest(workflowId, requestorId, actedByUserId, formResponses, req.user);
            res.status(201).json({
                success: true,
                data: workflowRequest,
            });
        }
        catch (error) {
            res.status(500).json({
                error: error.message || "Failed to start workflow request",
            });
        }
    }
    static async getWorkflowRequestForProcessing(req, res) {
        try {
            const filters = req.body.filters || [];
            const { limit, offset, search } = req.body;
            const { where } = (0, filterWhereBuilder_1.buildQueryWithIncludes)(filters);
            const result = await WorkflowExecutionController.workflowRequestService.findWithPagination({
                page: offset ? Number(offset) : 1,
                limit: limit ? Number(limit) : 10,
                search: search,
                where,
                include: [
                    {
                        model: models_1.Workflow,
                        as: "workflow",
                        include: [
                            {
                                model: models_1.Stage,
                                as: "stages",
                            },
                        ],
                    },
                    {
                        model: models_1.WorkflowInstanceStage,
                        as: "stages",
                        where: {
                            isResubmission: false,
                        },
                        include: [
                            {
                                model: models_1.Employee,
                                as: "assignedTo",
                                include: [models_1.Department, models_1.Position],
                            },
                        ],
                    },
                    {
                        model: models_1.Employee,
                        as: "requestor",
                        include: [models_1.Department, models_1.Position],
                    },
                ],
                orderby: [
                    ["createdAt", "DESC"],
                    [
                        { model: models_1.Workflow, as: "workflow" },
                        { model: models_1.Stage, as: "stages" },
                        "step",
                        "ASC",
                    ],
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
    static async getWorkflowRequestTasks(req, res) {
        try {
            const filters = req.body.filters || [];
            const { limit, offset, search } = req.body;
            const where = (0, filterWhereBuilder_1.buildWhere)(filters);
            console.log("======where===222=====", where);
            const result = await WorkflowExecutionController.workflowRequestService.findWithPagination({
                page: offset ? Number(offset) : 1,
                limit: limit ? Number(limit) : 10,
                search: search,
                where,
                include: [
                    {
                        model: models_1.Workflow,
                        as: "workflow",
                        include: [
                            {
                                model: models_1.Stage,
                                as: "stages",
                            },
                        ],
                    },
                    {
                        model: models_1.WorkflowInstanceStage,
                        as: "stages",
                        where: { assignedToUserId: req.user?.id, status: "Pending" },
                    },
                    {
                        model: models_1.Employee,
                        as: "requestor",
                        include: [models_1.Department, models_1.Position],
                    },
                ],
                orderby: [
                    ["createdAt", "DESC"],
                    [
                        { model: models_1.Workflow, as: "workflow" },
                        { model: models_1.Stage, as: "stages" },
                        "step",
                        "ASC",
                    ],
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
    static async getWorkflowRequests(req, res) {
        try {
            const filters = req.body.filters || [];
            const { limit, offset, search, status = "Pending" } = req.body;
            const { where, include } = (0, filterWhereBuilder_1.buildQueryWithIncludes)(filters, models_1.WorkflowInstanceStage);
            const result = await WorkflowExecutionController.workflowRequestService.findWithPagination({
                page: offset ? Number(offset) : 1,
                limit: limit ? Number(limit) : 10,
                search: search,
                where,
                include: [
                    {
                        model: models_1.Workflow,
                        as: "workflow",
                        include: [
                            {
                                model: models_1.Stage,
                                as: "stages",
                            },
                        ],
                    },
                    {
                        model: models_1.WorkflowInstanceStage,
                        as: "stages",
                        include: [{ model: models_1.Employee, as: "assignedTo" }],
                    },
                    {
                        model: models_1.Employee,
                        as: "requestor",
                        include: [models_1.Department, models_1.Position],
                    },
                ],
                orderby: [
                    ["createdAt", "DESC"],
                    [
                        { model: models_1.Workflow, as: "workflow" },
                        { model: models_1.Stage, as: "stages" },
                        "step",
                        "ASC",
                    ],
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
    static async getRequestHistory(req, res) {
        try {
            const filters = req.body.filters || [];
            const { limit, offset, search } = req.body;
            const { where } = (0, filterWhereBuilder_1.buildQueryWithIncludes)(filters);
            const result = await WorkflowExecutionController.workflowRequestService.findWithPagination({
                page: offset ? Number(offset) : 1,
                limit: limit ? Number(limit) : 10,
                search: search,
                where,
                include: [
                    {
                        model: models_1.Workflow,
                        as: "workflow",
                        include: [
                            {
                                model: models_1.Stage,
                                as: "stages",
                            },
                        ],
                    },
                    {
                        model: models_1.WorkflowInstanceStage,
                        as: "stages",
                        where: { assignedToUserId: req.user?.id },
                    },
                    {
                        model: models_1.Employee,
                        as: "requestor",
                        include: [models_1.Department, models_1.Position],
                    },
                ],
                orderby: [
                    ["createdAt", "DESC"],
                    [
                        { model: models_1.Workflow, as: "workflow" },
                        { model: models_1.Stage, as: "stages" },
                        "step",
                        "ASC",
                    ],
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
    static async getNextStage(req, res) {
        try {
            const { requestId } = req.params;
            if (!requestId || isNaN(Number(requestId))) {
                res.status(400).json({
                    error: "Valid requestId is required",
                });
                return;
            }
            const result = await WorkflowExecutionService_1.WorkflowExecutionService.getNextStage(Number(requestId));
            res.json(result);
        }
        catch (error) {
            res.status(500).json({
                error: error.message || "Failed to get next stage",
            });
        }
    }
    static async completeStage(req, res) {
        try {
            const data = req.body;
            const actedByUserId = req.user?.id;
            if (!data.stageId || !data.action || !actedByUserId) {
                res.status(400).json({
                    error: "stageId and action are required",
                });
                return;
            }
            if (!["Approve", "Reject"].includes(data.action)) {
                res.status(400).json({
                    error: 'Action must be either "Approve" or "Reject"',
                });
                return;
            }
            await WorkflowExecutionService_1.WorkflowExecutionService.completeStage({
                ...data,
                actedByUserId,
                user: req.user,
            });
            res.json({
                success: true,
                message: `Stage ${data.action}d successfully`,
            });
        }
        catch (error) {
            res.status(500).json({
                error: error.message || "Failed to complete stage",
            });
        }
    }
    static async sendBackInternalStage(req, res) {
        try {
            const data = req.body;
            const actedByUserId = req.user?.id;
            if (!data.stageId ||
                !data.comment ||
                !data.sentBackToRole ||
                !actedByUserId) {
                res.status(400).json({
                    error: "stageId, comment, and sentBackToRole are required",
                });
                return;
            }
            res.json({
                success: true,
                message: "Stage sent back for correction successfully",
            });
        }
        catch (error) {
            res.status(500).json({
                error: error.message || "Failed to send back stage",
            });
        }
    }
}
exports.WorkflowExecutionController = WorkflowExecutionController;
WorkflowExecutionController.workflowRequestService = new BaseService_1.BaseService(models_1.WorkflowRequest);
//# sourceMappingURL=WorkflowExecutionController.js.map