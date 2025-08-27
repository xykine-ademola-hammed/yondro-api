import { Request, Response } from "express";
import { WorkflowExecutionService } from "../services/WorkflowExecutionService";
import { StageCompletionData, InternalSendBackData } from "../types";
import {
  buildQueryWithIncludes,
  buildWhere,
  buildWhereClause,
  Filter,
} from "../utils/filterWhereBuilder";
import {
  Department,
  Employee,
  Position,
  Stage,
  Workflow,
  WorkflowInstanceStage,
  WorkflowRequest,
} from "../models";
import { BaseService } from "../services/BaseService";

export class WorkflowExecutionController {
  private static workflowRequestService = new BaseService(WorkflowRequest);

  /**
   * POST /workflow-request - Start a new workflow request
   */
  static async startWorkflowRequest(
    req: Request,
    res: Response
  ): Promise<void> {
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

      const workflowRequest =
        await WorkflowExecutionService.startWorkflowRequest(
          workflowId,
          requestorId,
          actedByUserId,
          formResponses,
          req.user
        );

      res.status(201).json({
        success: true,
        data: workflowRequest,
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to start workflow request",
      });
    }
  }

  static async getWorkflowRequestForProcessing(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const filters: Filter[] = req.body.filters || [];
      const { limit, offset, search } = req.body;

      const { where } = buildQueryWithIncludes(filters);

      const result =
        await WorkflowExecutionController.workflowRequestService.findWithPagination(
          {
            page: offset ? Number(offset) : 1,
            limit: limit ? Number(limit) : 10,
            search: search as string,
            where,
            include: [
              {
                model: Workflow,
                as: "workflow",
                include: [
                  {
                    model: Stage,
                    as: "stages",
                  },
                ],
              },
              {
                model: WorkflowInstanceStage,
                as: "stages",
                where: {
                  isResubmission: false,
                },
                include: [
                  {
                    model: Employee,
                    as: "assignedTo",
                    include: [Department, Position],
                  },
                ],
              },
              {
                model: Employee,
                as: "requestor",
                include: [Department, Position],
              },
            ],
            orderby: [
              ["createdAt", "DESC"],
              [
                { model: Workflow, as: "workflow" },
                { model: Stage, as: "stages" },
                "step",
                "ASC",
              ],
            ],
          }
        );

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to create department",
      });
    }
  }

  static async getWorkflowRequestTasks(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const filters: Filter[] = req.body.filters || [];
      const { limit, offset, search } = req.body;

      const where = buildWhere(filters);

      console.log("======where===222=====", where);

      const result =
        await WorkflowExecutionController.workflowRequestService.findWithPagination(
          {
            page: offset ? Number(offset) : 1,
            limit: limit ? Number(limit) : 10,
            search: search as string,
            where,
            include: [
              {
                model: Workflow,
                as: "workflow",
                include: [
                  {
                    model: Stage,
                    as: "stages",
                  },
                ],
              },
              {
                model: WorkflowInstanceStage,
                as: "stages",
                where: { assignedToUserId: req.user?.id, status: "Pending" },
              },
              {
                model: Employee,
                as: "requestor",
                include: [Department, Position],
              },
            ],
            orderby: [
              ["createdAt", "DESC"],
              [
                { model: Workflow, as: "workflow" },
                { model: Stage, as: "stages" },
                "step",
                "ASC",
              ],
            ],
          }
        );

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to create department",
      });
    }
  }

  static async getWorkflowRequests(req: Request, res: Response): Promise<void> {
    try {
      const filters: Filter[] = req.body.filters || [];
      const { limit, offset, search, status = "Pending" } = req.body;

      const { where, include } = buildQueryWithIncludes(
        filters,
        WorkflowInstanceStage
      );

      // console.log("======where========", where);
      // console.log("======include========", include);

      const result =
        await WorkflowExecutionController.workflowRequestService.findWithPagination(
          {
            page: offset ? Number(offset) : 1,
            limit: limit ? Number(limit) : 10,
            search: search as string,
            where,
            include: [
              {
                model: Workflow,
                as: "workflow",
                include: [
                  {
                    model: Stage,
                    as: "stages",
                  },
                ],
              },
              {
                model: WorkflowInstanceStage,
                as: "stages",
                include: [{ model: Employee, as: "assignedTo" }],
              },
              {
                model: Employee,
                as: "requestor",
                include: [Department, Position],
              },
            ],
            orderby: [
              ["createdAt", "DESC"],
              [
                { model: Workflow, as: "workflow" },
                { model: Stage, as: "stages" },
                "step",
                "ASC",
              ],
            ],
          }
        );

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to create department",
      });
    }
  }

  static async getRequestHistory(req: Request, res: Response): Promise<void> {
    try {
      const filters: Filter[] = req.body.filters || [];
      const { limit, offset, search } = req.body;

      const { where } = buildQueryWithIncludes(filters);

      const result =
        await WorkflowExecutionController.workflowRequestService.findWithPagination(
          {
            page: offset ? Number(offset) : 1,
            limit: limit ? Number(limit) : 10,
            search: search as string,
            where,
            include: [
              {
                model: Workflow,
                as: "workflow",
                include: [
                  {
                    model: Stage,
                    as: "stages", // Ensure this alias matches the orderby clause
                  },
                ],
              },
              {
                model: WorkflowInstanceStage,
                as: "stages",
                where: { assignedToUserId: req.user?.id },
              },
              {
                model: Employee,
                as: "requestor",
                include: [Department, Position],
              },
            ],
            orderby: [
              ["createdAt", "DESC"],
              [
                { model: Workflow, as: "workflow" },
                { model: Stage, as: "stages" },
                "step",
                "ASC",
              ],
            ],
          }
        );

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to create department",
      });
    }
  }

  /**
   * GET /next-stage/:requestId - Get next actionable stage
   */
  static async getNextStage(req: Request, res: Response): Promise<void> {
    try {
      const { requestId } = req.params;

      if (!requestId || isNaN(Number(requestId))) {
        res.status(400).json({
          error: "Valid requestId is required",
        });
        return;
      }

      const result = await WorkflowExecutionService.getNextStage(
        Number(requestId)
      );

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to get next stage",
      });
    }
  }

  /**
   * POST /stage/complete - Complete a stage (approve/reject)
   */
  static async completeStage(req: Request, res: Response): Promise<void> {
    try {
      const data: StageCompletionData = req.body;
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

      await WorkflowExecutionService.completeStage({
        ...data,
        actedByUserId,
        user: req.user,
      });

      res.json({
        success: true,
        message: `Stage ${data.action}d successfully`,
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to complete stage",
      });
    }
  }

  /**
   * POST /stage/internal/send-back - Send back within internal loop
   */
  static async sendBackInternalStage(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const data: InternalSendBackData = req.body;
      const actedByUserId = req.user?.id;

      if (
        !data.stageId ||
        !data.comment ||
        !data.sentBackToRole ||
        !actedByUserId
      ) {
        res.status(400).json({
          error: "stageId, comment, and sentBackToRole are required",
        });
        return;
      }

      // TODO: Validate sentBackToRole against allowed roles

      res.json({
        success: true,
        message: "Stage sent back for correction successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to send back stage",
      });
    }
  }
}
