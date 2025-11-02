import { Request, Response } from "express";
import { WorkflowExecutionService } from "../services/WorkflowExecutionService";
import { StageCompletionData, InternalSendBackData } from "../types";
import {
  buildQueryWithIncludes,
  buildWhere,
  Filter,
} from "../utils/filterWhereBuilder";
import {
  Department,
  Document,
  Employee,
  Position,
  Stage,
  VoteBookAccount,
  Voucher,
  VoucherLine,
  Workflow,
  WorkflowInstanceStage,
  WorkflowRequest,
} from "../models";
import { BaseService } from "../services/BaseService";
import { EmailService } from "../services/EmailService";
import { ro } from "@faker-js/faker/.";
import { StageUtils } from "../utils/stageUtils";
import { uploadFileToS3 } from "../config/s3";
import { Op } from "sequelize";
import VoteBookService from "../services/voteBookService";

/**
 * Extracts the formKey from a file name of format `<timestamp>_<formKey>.<extension>`
 * Example: '1688543549_purchaseOrder.pdf' => 'purchaseOrder'
 * @param fileName - The file name (with or without path)
 * @returns the extracted formKey, or undefined if format is incorrect
 */
export function extractFormKeyFromFileName(fileName: string): string {
  if (!fileName) return "";
  // Remove any directories (if mistakenly present)
  const justFile = fileName.split("/").pop() || fileName;
  // Remove extension
  const base = justFile.replace(/\.[^/.]+$/, "");
  // Split by '_'
  const parts = base.split("_");
  if (parts.length < 2) return ""; // doesn't match expected format
  // formKey is everything after the first '_', in case formKey itself contains underscores
  return parts.slice(1).join("_");
}

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
      const { workflowId, requestorId, ...formResponses } = req.body;

      const actedByUserId = req.user?.id;

      if (!workflowId || !requestorId) {
        res.status(400).json({
          error: "workflowId !requestorId is required",
        });
        return;
      }

      const workflowRequest =
        await WorkflowExecutionService.startWorkflowRequest(
          workflowId,
          requestorId,
          actedByUserId,
          formResponses,
          req.user
        );

      await this.uploadFileToRequest(req, res, workflowRequest);

      await new EmailService().sendTaskEmail(workflowRequest);

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

      // console.log("======where===222=====", where);

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

      // Fix async filter usage: get results in parallel, then filter
      const nextStageAssigneeChecks = await Promise.all(
        result.rows.map(async (item) => {
          // get the latest workflowInstanceStage
          const nextStage = await StageUtils.getNextStage(item.id);

          if (nextStage?.isSubStage) {
            console.log(
              "=====nextStage=111=====",
              nextStage.assignedToUserId,
              req.user?.id
            );

            console.log(
              "====req.user?.id=======",
              nextStage.assignedToUserId === req.user?.id
            );

            return nextStage.assignedToUserId === req.user?.id;
          } else {
            return true;
          }
        })
      );

      const cleanUpSubTaskNotNextStage = result.rows.filter(
        (_item, idx) => nextStageAssigneeChecks[idx]
      );

      res.json({ ...result, rows: cleanUpSubTaskNotNextStage });
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

      if (
        ![
          "Approve",
          "Reject",
          "Payment",
          "Procurement",
          "Acknowledgement",
          "Recommend",
        ].includes(data.action)
      ) {
        res.status(400).json({
          error: "Action must be either valid action types",
        });
        return;
      }

      await WorkflowExecutionService.completeStage({
        ...data,
        actedByUserId,
        user: req.user,
      });

      const stage = await WorkflowInstanceStage.findByPk(data.stageId, {
        include: [
          { model: Stage, as: "stage" },
          { model: WorkflowRequest, as: "request", include: [Workflow] },
        ],
      });

      if (stage?.request)
        await this.uploadFileToRequest(req, res, stage?.request);

      if (
        stage?.stageName === "Payment Voucher Approval" &&
        stage.stage.trigerVoucherCreation &&
        stage.status === "Approved"
      ) {
        const voucher_number = await generateVoucherNumber(
          req?.user?.organizationId
        );
        const voucher = await Voucher.create({
          voucher_number,
          organization_id: req?.user?.organizationId!,
          requester_id: req.user!.id,
          payee_name: stage.request.formResponses.applicantName,
          payee_address: stage.request.formResponses.applicantAddress,
          purpose: stage.request.formResponses.applicantDescription,
          total_amount: stage.request.formResponses.debitAmount,
          tax_amount: 0,
          net_amount: stage.request.formResponses.debitAmount,
          currency: "NGN",
          priority: "high",
          due_date: undefined,
          invoice_number: stage.request.formResponses.voucherNo,
          po_number: stage.request.formResponses.voucherNo,
          notes: "",
          status: "posted",
          attachment_count: 0,
        });

        const line = await VoucherLine.create({
          voucher_id: voucher.id,
          account_id: stage.request.formResponses.selectedVoucherAccount?.id,
          line_number: 1,
          description: stage.request.formResponses.paymentParticles,
          quantity: 1,
          unit_cost: stage.request.formResponses.paymentDetailAmount,
          total_amount: stage.request.formResponses.paymentDetailAmount,
          tax_code: stage.request.formResponses.accountCodeNo,
          tax_amount: 0,
        });

        // postToVoteBook
        await VoteBookAccount.update(
          {
            spent: VoteBookAccount.sequelize!.literal(
              `spent + ${line.total_amount}`
            ),
          },
          {
            where: { id: line.account_id },
          }
        );
      }

      if (stage) await new EmailService().sendTaskEmail(stage?.request);

      res.json({
        success: true,
        message: `Stage ${data.action} successfully`,
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

  static async uploadFileToRequest(
    req: Request,
    res: Response,
    workflowRequest: WorkflowRequest
  ): Promise<void> {
    const files = req.files;

    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes

    // Ensure 'files' is an array of files
    const filesArray: any[] = Array.isArray(files)
      ? files
      : files
      ? [files]
      : [];

    let urls: Record<string, string> = {};

    if (filesArray.length > 0) {
      const optionPromises = filesArray.map(async (file, index) => {
        if (!allowedTypes.includes(file.mimetype)) {
          return res.status(400).json({
            success: false,
            error: "Invalid file type. Only JPEG, PNG, and PDF are allowed.",
          });
        }

        if (file.size > maxSize) {
          return res.status(400).json({
            success: false,
            error: "File size exceeds 5MB limit.",
          });
        }

        const key = `files/${Date.now()}-${file.originalname}`.trim();

        const fieldName: string = extractFormKeyFromFileName(file.originalname);

        const url = await uploadFileToS3(file, key);

        if (!url) {
          return res.status(500).json({
            success: false,
            error: "Failed to upload image to S3.",
          });
        }

        await Document.create({
          entityId: Number(workflowRequest.id),
          entityType: "WORKFLOW_REQUEST",
          url,
          createdBy: workflowRequest.createdBy,
          fieldName,
        });

        urls[fieldName] = url;
      });
      await Promise.all(optionPromises);

      await WorkflowRequest.update(
        { formResponses: { ...req.body.formResponses, ...urls } },
        { where: { id: workflowRequest.id } }
      );
    }
  }
}

const generateVoucherNumber = async (organizationId?: number) => {
  const year = new Date().getFullYear();
  const lastVoucher = await Voucher.findOne({
    where: {
      organization_id: organizationId!,
      voucher_number: {
        [Op.like]: `${organizationId}-${year}-%`,
      },
    },
    order: [["created_at", "DESC"]],
  });

  let sequence = 1;
  if (lastVoucher) {
    const lastSequence = parseInt(lastVoucher.voucher_number.split("-")[2]);
    sequence = lastSequence + 1;
  }

  const voucher_number = `${organizationId}-${year}-${sequence
    .toString()
    .padStart(6, "0")}`;
  return voucher_number;
};
