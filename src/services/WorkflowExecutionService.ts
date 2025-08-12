import {
  WorkflowRequest,
  WorkflowInstanceStage,
  Stage,
  Workflow,
  Employee,
} from "../models";
import {
  WorkflowRequestStatus,
  WorkflowInstanceStageStatus,
  StageCompletionData,
  InternalSendBackData,
  NextStageResponse,
} from "../types";
import { StageUtils, subStageActorType } from "../utils/stageUtils";
import { Op, where } from "sequelize";

export class WorkflowExecutionService {
  /**
   * Starts a new workflow request
   */
  static async startWorkflowRequest(
    workflowId: number,
    requestorId: number,
    actedByUserId?: number,
    formResponses?: any
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
      formResponses,
      workflowId,
      requestorId,
      organizationId: workflow.organizationId,
      status: WorkflowRequestStatus.PENDING,
      createdBy: actedByUserId || requestorId,
    });

    console.log("```Workflow request created:", workflowRequest.id);
    // Assign user for first stage
    let assignedToUserId: number = requestorId;

    // Create first workflow instance stage
    const firstInstanceStage = await WorkflowInstanceStage.create({
      workflowRequestId: workflowRequest.id,
      stageName: firstStage?.name,
      step: firstStage.step,
      assignedToUserId,
      status: WorkflowInstanceStageStatus.SUBMITTED,
      fieldResponses: firstStage.formFields.map((field: string) => ({
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

      let assignedToUserId: number = requestorId;

      // check if the second stage need an employee to be assigned
      if (secondStage.assigineeLookupField) {
        console.log("-----1--------", secondStage);
        assignedToUserId = formResponses[secondStage.assigineeLookupField];
      } else {
        console.log("-----2--------", secondStage.assigineeLookupField);

        const nextStageemployee = await Employee.findOne({
          where: {
            departmentId: secondStage.assigneeDepartmentId,
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
          { model: WorkflowRequest, as: "request" },
        ],
      });

      if (!stage) {
        throw new Error("Stage not found");
      }

      const [affectedRows] = await WorkflowRequest.update(
        { formResponses: data.formResponses },
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
      const newStatus =
        data.action === "Approve"
          ? WorkflowInstanceStageStatus.APPROVED
          : WorkflowInstanceStageStatus.REJECTED;

      await stage.update({
        status: newStatus,
        fieldResponses: data.fieldResponses,
        comment: data.comment,
        actedByUserId: data.actedByUserId,
        actedAt: new Date(),
      });

      if (data.action === "Reject") {
        console.log("Sibl=======data.action=======jected:", data.action);
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
            },
            order: [["step", "ASC"]],
          });

          if (siblingStages.length > 0) {
            for (let i = 0; i < siblingStages.length; i++) {
              await siblingStages[i].update({
                status: WorkflowInstanceStageStatus.REJECTED,
                isResubmission: true,
              });
              await WorkflowInstanceStage.create({
                isSubStage: true,
                isResubmission: false,
                stageName: siblingStages[i]?.stageName,
                step: siblingStages[i].step,
                parentStep: siblingStages[i].parentStep,
                workflowRequestId: stage.workflowRequestId,
                assignedToUserId: siblingStages[i].assignedToUserId,
                status: WorkflowInstanceStageStatus.PENDING,
                fieldResponses: {},
                stageId: siblingStages[i].stageId,
                organizationId: siblingStages[i].organizationId,
              });
            }
          }
        } else {
          await stage.request!.update({
            status: WorkflowRequestStatus.REJECTED,
          });
        }

        return;
      }

      // Handle approval
      if (stage.isSubStage) {
        // Check if this is the final sub-stage (Approver)
        const siblingStages = await WorkflowInstanceStage.findAll({
          where: {
            workflowRequestId: stage.workflowRequestId,
            parentStep: stage.parentStep,
            isSubStage: true,
          },
          order: [["step", "DESC"]],
        });
        const isLastSubStage = siblingStages[0].id === stage.id;
        if (isLastSubStage) {
          // Create next main stage
          // Get next main stage from workflow
          const nextStage = await StageUtils.createNextMainStage(data, stage);

          // No more stages - mark request as approved
          if (!nextStage) {
            await stage.request!.update({
              status: WorkflowRequestStatus.APPROVED,
            });
          }
        }

        return;
      } else {
        // if stage is a parentStep, then create internal stages
        const subStages = await Stage.findAll({
          where: {
            parentStep: stage.step,
            isSubStage: true,
          },
        });

        if (subStages.length > 0) {
          for (let i = 0; i < subStages.length; i++) {
            let assignedToUserId: number = data.actedByUserId;

            // check if the second stage need an employee to be assigned
            if (subStages[i].assigineeLookupField && data?.formResponses) {
              assignedToUserId =
                data?.formResponses[subStages[i].assigineeLookupField];
            } else {
              const subStageEmployee = await Employee.findOne({
                where: {
                  departmentId: subStages[i].assigneeDepartmentId,
                  positionId: subStages[i].assigneePositionId,
                },
              });
              if (subStageEmployee) assignedToUserId = subStageEmployee?.id;
            }

            await WorkflowInstanceStage.create({
              ...subStages[i],
              isSubStage: true,
              isResubmission: false,
              stageName: subStages[i].name,
              step: subStages[i].step,
              parentStep: subStages[i].parentStep,
              workflowRequestId: stage.workflowRequestId,
              assignedToUserId,
              status: WorkflowInstanceStageStatus.PENDING,
              fieldResponses: {},
              stageId: subStages[i].id,
              organizationId: subStages[i].organizationId,
            });
          }
        } else {
          // Main stage approved
          // Get next main stage from workflow
          const nextStage = await StageUtils.createNextMainStage(data, stage);

          // No more stages - mark request as approved
          if (!nextStage) {
            await WorkflowRequest.update(
              { status: WorkflowRequestStatus.APPROVED },
              {
                where: {
                  id: stage.request.id,
                },
              }
            );
          }

          return;
        }
      }
    } catch (error) {
      console.log("-----------------------------D-RRRR--------", error);
    }
  }
}
