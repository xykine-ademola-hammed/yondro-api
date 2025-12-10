import { Request, Response } from "express";
import { BaseService } from "../services/BaseService";
import { WorkflowInstanceStage } from "../models";
import { findUserInboxWithCTE } from "../services/WorkflowInstanceStageService";

export class WorkflowInstanceStageController {
  private static workflowService = new BaseService(WorkflowInstanceStage);

  /**
   * GET /workflow/:id - Get workflow with stages
   */

  static async getWorkflowInstanceStages(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { departmentId, employeeId, limit, offset, formId, status } =
        req.body;

      const result = await findUserInboxWithCTE({
        organizationId: req.user?.organizationId,
        assignedToUserId: req.user?.id,
        departmentId, // optional
        employeeId, // ignore
        status, // optional
        formId, // optional
        limit,
        offset,
      });

      res.json(result);
    } catch (error: any) {
      res.status(500).json({
        error: error.message || "Failed to create department",
      });
    }
  }
}
