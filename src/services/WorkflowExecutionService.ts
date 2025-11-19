import {
  WorkflowRequest,
  WorkflowInstanceStage,
  Stage,
  Workflow,
  Employee,
  Position,
  Voucher,
  VoucherLine,
  VoteBookAccount,
} from "../models";
import {
  WorkflowRequestStatus,
  WorkflowInstanceStageStatus,
  StageCompletionData,
  NextStageResponse,
  statusMapper,
} from "../types";
import {
  buildInboxParams,
  WORKFLOW_INBOX_COUNT_SQL,
  WORKFLOW_INBOX_SQL_CTE,
  WorkflowInboxFilter,
  WorkflowInboxPage,
  WorkflowInboxRow,
} from "../utils/requestQuery-helper";
import { StageUtils } from "../utils/stageUtils";
import { Op, QueryTypes, Sequelize } from "sequelize";

export class WorkflowExecutionService {
  /**
   * Starts a new workflow request
   */
  static async startWorkflowRequest(
    workflowId: number,
    requestorId: number,
    actedByUserId?: number,
    formResponses?: any,
    user?: any
  ): Promise<WorkflowRequest> {
    // Get the workflow and its first stage
    const workflow = await Workflow.findByPk(workflowId, {
      include: [
        {
          model: Stage,
          as: "stages",
          order: [["step", "ASC"]], // Order stages by step in ascending order
        },
      ],
      order: [
        ["createdAt", "DESC"],
        [{ model: Stage, as: "stages" }, "step", "ASC"],
      ],
    });

    if (!workflow || !workflow.stages || workflow.stages.length === 0) {
      throw new Error("Workflow not found or has no initial stage");
    }

    const firstStage = workflow.stages[0];

    // Create workflow request
    const workflowRequest = await WorkflowRequest.create({
      formId: workflow.formId,
      formResponses: {
        ...formResponses,
        requestor: {
          firstName: user.firstName,
          lastName: user.lastName,
          date: new Date(),
          department: user?.department?.name,
          position: user?.position?.title,
          category: user.position.category,
        },
      },
      workflowId,
      requestorId,
      organizationId: workflow.organizationId,
      status: WorkflowRequestStatus.PENDING,
      createdBy: actedByUserId || user.id,
    });

    console.log("```Workflow request created:", workflowRequest.id);
    // Assign user for first stage
    let assignedToUserId: number = user.id;

    // Create first workflow instance stage
    const firstInstanceStage = await WorkflowInstanceStage.create({
      workflowRequestId: workflowRequest?.id,
      stageName: firstStage?.name,
      step: firstStage?.step,
      assignedToUserId,
      status: WorkflowInstanceStageStatus.SUBMITTED,
      fieldResponses: firstStage?.formFields?.map?.((field: string) => ({
        field: formResponses[field],
      })),
      stageId: firstStage.id,
      isSubStage: false,
      isResubmission: false,
      actedByUserId,
      organizationId: workflow.organizationId,
    });
    console.log("```222-----Workflow request created:", assignedToUserId);
    // If first stage requires internal loop, create sub-stages
    if (firstStage.isSubStage) {
      // Create sub-stages
    } else {
      // Then create the next stage WorkflowInstanceStage without fieldResponses
      let secondStage = workflow.stages[1];

      // Jump step if user hierarchyLevel is 3
      if (user.position.hierarchyLevel === 3) {
        await WorkflowInstanceStage.create({
          workflowRequestId: workflowRequest.id,
          stageName: secondStage.name,
          step: secondStage.step,
          assignedToUserId: actedByUserId,
          status: WorkflowInstanceStageStatus.APPROVED,
          fieldResponses: {},
          stageId: secondStage.id,
          isSubStage: false,
          isResubmission: false,
          actedByUserId,
          organizationId: workflow?.organizationId,
        });
        secondStage = workflow.stages[2];
      }

      let assignedToUserId;

      const requestorParent = await this.getRequestorParent(requestorId);
      if (requestorParent) {
        assignedToUserId = requestorParent.id;
      }

      // check if the second stage need an employee to be assigned
      if (secondStage.assigineeLookupField) {
        assignedToUserId = formResponses[secondStage.assigineeLookupField];
      } else if (secondStage.assigneePositionId) {
        const nextStageemployee = await Employee.findOne({
          where: {
            positionId: secondStage.assigneePositionId,
          },
        });
        if (nextStageemployee) assignedToUserId = nextStageemployee?.id;
      }

      console.log("``3333`Workflow assignedToUserId", assignedToUserId);

      await WorkflowInstanceStage.create({
        workflowRequestId: workflowRequest.id,
        stageName: secondStage.name,
        step: secondStage.step,
        assignedToUserId,
        status: WorkflowInstanceStageStatus.PENDING,
        fieldResponses: {},
        stageId: secondStage.id,
        isSubStage: false,
        isResubmission: false,
        actedByUserId,
        organizationId: workflow.organizationId,
      });
    }

    return workflowRequest;
  }

  static async getRequestorParent(requestorId: number) {
    const requestor = await Employee.findByPk(requestorId, {
      include: [Position],
    });

    const parentPosition = await Position.findByPk(
      requestor?.position.parentPositionId,
      { include: [Employee] }
    );

    console.log("-----0.1--------", parentPosition?.employees);

    const requestorParent = parentPosition?.employees[0];
    return requestorParent;
  }

  /**
   * Gets the next actionable stage for a workflow request
   */
  static async getNextStage(requestId: number): Promise<NextStageResponse> {
    const workflowRequest = await WorkflowRequest.findByPk(requestId);
    if (!workflowRequest) {
      throw new Error("Workflow request not found");
    }

    if (workflowRequest.status !== WorkflowRequestStatus.PENDING) {
      return {
        currentStage: null,
        isComplete: true,
        requiresAction: false,
      };
    }

    const nextStage = await StageUtils.getNextStage(requestId);

    if (!nextStage) {
      return {
        currentStage: null,
        isComplete: true,
        requiresAction: false,
      };
    }

    return {
      currentStage: nextStage,
      nextStage: null,
      isComplete: false,
      requiresAction: nextStage.status === WorkflowInstanceStageStatus.PENDING,
    };
  }

  /**
   * Completes a stage (approve or reject)
   */
  static async completeStage(
    data: StageCompletionData & { actedByUserId: number }
  ): Promise<void> {
    try {
      const stage = await WorkflowInstanceStage.findByPk(data.stageId, {
        include: [
          { model: Stage, as: "stage" },
          { model: WorkflowRequest, as: "request", include: [Workflow] },
        ],
      });

      if (!stage) {
        throw new Error("Stage not found");
      }

      const approvers = data?.formResponses?.approvers ?? [];
      approvers.push({
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        date: new Date(),
        schoolOrOffice: data?.user?.schoolOrOffice?.name,
        department: data?.user?.department?.name,
        position: data?.user?.position?.title,
        label: data.action,
      });

      const [affectedRows] = await WorkflowRequest.update(
        { formResponses: { ...data.formResponses, approvers } },
        {
          where: { id: stage.workflowRequestId },
        }
      );
      if (affectedRows !== 1) {
        console.log("Handle error: no record or multiple records updated");
      }

      if (stage.status !== WorkflowInstanceStageStatus.PENDING) {
        throw new Error("Stage is not in pending status");
      }
      // Update current stage
      const newStatus = statusMapper[data.action] || statusMapper["Reject"];
      await stage.update({
        status: newStatus,
        fieldResponses: data.fieldResponses,
        comment: data.comment,
        actedByUserId: data.actedByUserId,
        actedAt: new Date(),
      });

      const resubmissionStage = await Stage.findOne({
        where: {
          workflowId: stage.request.workflow.id,
          isResubmissionStage: true,
        },
      });

      if (data.action === "Reject") {
        if (stage.isSubStage) {
          const siblingStages = await WorkflowInstanceStage.findAll({
            where: {
              workflowRequestId: stage.workflowRequestId,
              parentStep: stage.parentStep,
              step: {
                [Op.lte]: stage.step, // Use Op.lte for "less than or equal to"
              },
              isSubStage: true,
              status: { [Op.ne]: "Pending" },
              isResubmission: false,
            },
            order: [["step", "ASC"]],
          });

          await WorkflowInstanceStage.update(
            {
              isResubmission: true,
            },
            { where: { parentStep: stage.parentStep } }
          );

          if (siblingStages.length > 0) {
            // Only create the fist one, this will prevent creating siblings upfront and it won't show in UI
            await WorkflowInstanceStage.create({
              isSubStage: true,
              isResubmission: false,
              stageName: siblingStages[0]?.stageName,
              step: siblingStages[0].step,
              parentStep: siblingStages[0].parentStep,
              workflowRequestId: stage.workflowRequestId,
              assignedToUserId: siblingStages[0].assignedToUserId,
              status: WorkflowInstanceStageStatus.PENDING,
              fieldResponses: {},
              stageId: siblingStages[0].stageId,
              organizationId: siblingStages[0].organizationId,
            });
          }
        } else if (resubmissionStage) {
          // Check if the workflow has a rejectResubmitStep
          // mark every stageInstance step above the rejectResubmitStep to isResubmission
          await WorkflowInstanceStage.update(
            { isResubmission: true },
            {
              where: {
                workflowRequestId: stage.request.id,
                step: {
                  [Op.gt]: Number(resubmissionStage.step),
                },
              },
            }
          );

          const stageInstanceClone = await WorkflowInstanceStage.findOne({
            where: {
              workflowRequestId: stage.request.id,
              step: Number(resubmissionStage.step),
            },
          });

          // Then update that stageInstance (for rejectResubmitStep) to Pending
          await WorkflowInstanceStage.create({
            isSubStage: true,
            isResubmission: false,
            stageName: stageInstanceClone?.stageName,
            step: stageInstanceClone?.step,
            parentStep: stageInstanceClone?.parentStep,
            workflowRequestId: stage.workflowRequestId,
            assignedToUserId: stageInstanceClone?.assignedToUserId,
            status: WorkflowInstanceStageStatus.PENDING,
            fieldResponses: {},
            stageId: stageInstanceClone?.stageId,
            organizationId: stageInstanceClone?.organizationId,
          });

          console.log("=========10==========");
        } else {
          await stage.request!.update({
            status: WorkflowRequestStatus.REJECTED,
          });
        }

        return;
      }

      // Handle approval
      // Check if this is sub-stage (Approver)
      const nextStage = await Stage.findOne({
        where: {
          workflowId: stage.request.workflow.id,
          step: Number(stage.step) + 1,
        },
      });

      console.log("------------1---------------");

      if (nextStage?.isSubStage) {
        // Create nextSibling
        await StageUtils.createNextSubStage(data, stage, nextStage);
      } else if (nextStage) {
        console.log("------------2---------------");
        // Create next main stage
        // Get next main stage from workflow
        await StageUtils.createNextMainStage(data, stage);
      } else {
        // No more stages - mark request as approved

        await stage.request!.update({
          status: WorkflowRequestStatus.APPROVED,
        });
      }

      // Check if the stage of the stateInstance require creation of request for Voucher Creation.
      if (stage.stage.triggerVoucherCreation) {
        // Data should have information about the Head of Voucher Unit
        const voucherWorkflow = await Workflow.findOne({
          where: { name: "Payment Voucher Auto" },
          include: [
            {
              model: Stage,
              as: "stages",
              order: [["step", "ASC"]], // Order stages by step in ascending order
            },
          ],
          order: [
            ["createdAt", "DESC"],
            [{ model: Stage, as: "stages" }, "step", "ASC"],
          ],
        });
        const firstStage = voucherWorkflow?.stages[0];
        const secondStage = voucherWorkflow?.stages[1];
        const voucherWorkflowRequest = await WorkflowRequest.create({
          formId: voucherWorkflow?.formId,
          formResponses: {
            unitVoucherHeadById: data?.formResponses?.unitVoucherHeadById,
            financeCode: data?.formResponses?.financeCode,
            departmentCode: data?.formResponses?.departmentCode,
            requestor: {
              firstName: data?.user?.firstName,
              lastName: data?.user?.lastName,
              date: new Date(),
              department: data?.user?.department?.name,
              position: data?.user?.position?.title,
            },
          },
          workflowId: voucherWorkflow?.id,
          requestorId: data?.user?.id,
          organizationId: data?.user?.organizationId,
          status: WorkflowRequestStatus.PENDING,
          createdBy: data?.user?.id,
          parentRequestId: stage.request.id,
        });

        await WorkflowInstanceStage.create({
          workflowRequestId: voucherWorkflowRequest?.id,
          stageName: firstStage?.name,
          step: firstStage?.step,
          assignedToUserId: data?.user?.id,
          status: WorkflowInstanceStageStatus.SUBMITTED,
          fieldResponses: {},
          stageId: firstStage?.id,
          isSubStage: false,
          isResubmission: false,
          actedByUserId: data?.user?.id,
          organizationId: data?.user?.organizationId,
        });
        await WorkflowInstanceStage.create({
          workflowRequestId: voucherWorkflowRequest?.id,
          stageName: secondStage?.name,
          step: secondStage?.step,
          assignedToUserId: data?.formResponses?.unitVoucherHeadById,
          status: WorkflowInstanceStageStatus.PENDING,
          fieldResponses: { ...data?.formResponses },
          stageId: secondStage?.id,
          isSubStage: false,
          isResubmission: false,
          actedByUserId: data?.formResponses?.unitVoucherHeadById,
          organizationId: data?.user?.organizationId,
        });
      }

      return;
    } catch (error) {
      console.error("-----------------------------D-RRRR--------", error);
    }
  }

  static async processStageVoucher(
    data: StageCompletionData & { actedByUserId: number }
  ): Promise<void> {
    // Dealing with Entrying Votebook information and posting voucher
    const stage = await WorkflowInstanceStage.findByPk(data.stageId, {
      include: [
        { model: Stage, as: "stage" },
        { model: WorkflowRequest, as: "request", include: [Workflow] },
      ],
    });

    const existingVoucher = await Voucher.findOne({
      where: { entityId: stage?.request.id },
    });

    // Rejected Clear the existing Voucher and Voucher Lines
    if (existingVoucher && data.action === "Reject") {
      const existingVoucherLine = await VoucherLine.findOne({
        where: { voucher_id: existingVoucher.id },
      });

      // postToVoteBook
      await VoteBookAccount.update(
        {
          spent: VoteBookAccount.sequelize!.literal(
            `spent - ${existingVoucherLine?.total_amount}`
          ),
        },
        {
          where: { id: existingVoucherLine?.account_id },
        }
      );

      await existingVoucherLine?.destroy();
      await existingVoucher.destroy();
    } else if (
      stage?.stage.triggerVotebookEntry &&
      stage?.status === "Approved"
    ) {
      const voucher_number = await generateVoucherNumber(
        data?.user?.organizationId
      );

      const voucher = await Voucher.create({
        voucher_number,
        organization_id: data?.user?.organizationId!,
        requester_id: data.user!.id,
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
        entityId: stage.request.id,
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
  }

  static async fetchWorkflowInboxPage(
    sequelize: Sequelize,
    filters: WorkflowInboxFilter
  ): Promise<WorkflowInboxPage> {
    const limit = filters.limit ?? 10;
    const offset = filters.offset ?? 0;
    const params = buildInboxParams({ ...filters, limit, offset });

    // 1) Get total count
    const [countRow] = await sequelize.query<{ totalItems: number }>(
      WORKFLOW_INBOX_COUNT_SQL,
      {
        type: QueryTypes.SELECT,
        replacements: params,
        raw: true,
      }
    );

    const totalItems = countRow?.totalItems ?? 0;
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / limit);
    const page = totalItems === 0 ? 0 : Math.floor(offset / limit) + 1;

    // 2) Get paginated rows
    const rows = await sequelize.query<WorkflowInboxRow>(
      WORKFLOW_INBOX_SQL_CTE,
      {
        type: QueryTypes.SELECT,
        replacements: params,
        nest: true,
        raw: true,
      }
    );

    return {
      rows,
      totalItems,
      totalPages,
      page,
      limit,
    };
  }

  static async fetchWorkflowInbox(
    sequelize: Sequelize,
    filters: WorkflowInboxFilter
  ): Promise<WorkflowInboxRow[]> {
    const params = buildInboxParams(filters);

    const rows = await sequelize.query<WorkflowInboxRow>(
      WORKFLOW_INBOX_SQL_CTE,
      {
        type: QueryTypes.SELECT,
        replacements: params,
        nest: true, // "workflow.id" -> { workflow: { id: ... } }
        raw: true,
      }
    );

    return rows;
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
