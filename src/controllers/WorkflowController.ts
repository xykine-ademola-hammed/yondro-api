import { Request, Response } from "express";
import { BaseService } from "../services/BaseService";
import { Workflow, Stage } from "../models";
import { buildQueryWithIncludes, Filter } from "../utils/filterWhereBuilder";

export class WorkflowController {
  private static workflowService = new BaseService(Workflow);
  private static stageService = new BaseService(Stage);

  /**
   * POST /workflow - Create a new workflow
   */
  static async createWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const workflow = await WorkflowController.workflowService.create({
        ...req.body,
        createdBy: req?.user?.id,
      });
      res.status(201).json(workflow);
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to create workflow",
      });
    }
  }

  /**
   * GET /workflow/:id - Get workflow with stages
   */
  static async getWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        res.status(400).json({
          error: "Valid workflow id is required",
        });
        return;
      }

      const workflow = await WorkflowController.workflowService.findById(
        Number(id),
        {
          include: [
            {
              model: Stage,
              as: "stages",
              order: [["step", "ASC"]],
            },
          ],
        }
      );

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
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to get workflow",
      });
    }
  }

  static async getWorkflows(req: Request, res: Response): Promise<void> {
    try {
      const { organizationId, name, description } = req.body;

      const filters: Filter[] = req.body.filters || [];
      const { limit, offset, search } = req.body;

      const { where } = buildQueryWithIncludes(filters);

      const result =
        await WorkflowController.workflowService.findWithPagination({
          page: offset ? Number(offset) : 1,
          limit: limit ? Number(limit) : 10,
          search: search as string,
          where,
          include: [{ model: Stage }],
          orderby: [
            ["createdAt", "DESC"],
            [{ model: Stage, as: "stages" }, "step", "ASC"],
          ],
        });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to create department",
      });
    }
  }

  /**
   * POST /workflow/:id/stage - Add stage to workflow
   */
  static async addStageToWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, step, requiresInternalLoop, departmentId, fields } =
        req.body;

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

      // Check if workflow exists
      const workflow = await WorkflowController.workflowService.findById(
        Number(id)
      );
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
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to add stage to workflow",
      });
    }
  }

  /**
   * PUT /workflow/:id - Update workflow
   */
  static async updateWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!id || isNaN(Number(id))) {
        res.status(400).json({
          error: "Valid workflow id is required",
        });
        return;
      }

      const workflow = await WorkflowController.workflowService.update(
        Number(id),
        updateData
      );

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
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to update workflow",
      });
    }
  }

  /**
   * DELETE /workflow/:id - Delete workflow
   */
  static async deleteWorkflow(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id || isNaN(Number(id))) {
        res.status(400).json({
          error: "Valid workflow id is required",
        });
        return;
      }

      const deleted = await WorkflowController.workflowService.delete(
        Number(id)
      );

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
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to delete workflow",
      });
    }
  }
}
