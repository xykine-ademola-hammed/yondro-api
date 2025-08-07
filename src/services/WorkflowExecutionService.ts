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
    nextStageEmployeeId: number,
    actedByUserId?: number,
    fieldResponses?: any,
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
    });

    // Assign user for first stage
    let assignedToUserId: number = requestorId;

    // Create first workflow instance stage
    const firstInstanceStage = await WorkflowInstanceStage.create({
      workflowRequestId: workflowRequest.id,
      stageName: firstStage?.name,
      step: firstStage.step,
      assignedToUserId,
      status: WorkflowInstanceStageStatus.SUBMITTED,
      fieldResponses,
      stageId: firstStage.id,
      isSubStage: false,
      isResubmission: false,
      actedByUserId,
      organizationId: workflow.organizationId,
    });

    // If first stage requires internal loop, create sub-stages
    if (firstStage.requiresInternalLoop) {
      await StageUtils.ensureInternalStagesExist(
        workflowRequest.id,
        firstInstanceStage,
        firstStage
      );
    } else {
      // Then create the next stage WorkflowInstanceStage without fieldResponses
      const secondStage = workflow.stages[1];
      let assignedToUserId = nextStageEmployeeId;
      if (!nextStageEmployeeId) {
        const nextStageemployee = await Employee.findOne({
          where: {
            departmentId: secondStage.assignee.departmentId,
            positionId: secondStage.assignee.positionId,
          },
        });
        if (nextStageemployee) assignedToUserId = nextStageemployee?.id;
      }

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

      await stage?.request!.update({
        formResponses: data.formResponses,
      });

      if (!stage) {
        throw new Error("Stage not found");
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
        if (stage.isSubStage) {
          const siblingStages = await WorkflowInstanceStage.findAll({
            where: {
              workflowRequestId: stage.workflowRequestId,
              parentStageId: stage.parentStageId,
              step: {
                [Op.lt]: stage.step, // Use Op.lte for "less than or equal to"
              },
              isSubStage: true,
              status: { [Op.ne]: "Rejected" },
            },
            order: [["step", "ASC"]],
          });

          siblingStages.push(stage);

          const stageActors: subStageActorType[] = siblingStages.map(
            (sibling) => ({
              assignedToUserId: sibling.assignedToUserId,
              subStageName: sibling.stageName,
            })
          );

          const parentStageId = stage.parentStageId;

          await StageUtils.createInternalLoopStages(
            stage.workflowRequestId,
            stage,
            stageActors,
            stage.step,
            true,
            parentStageId
          );
        } else {
          await stage.request!.update({
            status: WorkflowRequestStatus.REJECTED,
          });
        }

        return;
      }

      // Handle approval
      if (stage.isSubStage) {
        console.log("=====2=====");

        // Check if this is the final sub-stage (Approver)
        const siblingStages = await WorkflowInstanceStage.findAll({
          where: {
            workflowRequestId: stage.workflowRequestId,
            parentStageId: stage.parentStageId,
            isSubStage: true,
          },
          order: [["step", "DESC"]],
        });

        console.log("=====3=====");

        const isLastSubStage = siblingStages[0].id === stage.id;

        if (isLastSubStage) {
          // Create next main stage
          const currentMainStep = Math.floor(stage.step);
          const nextMainStage = await StageUtils.createNextMainStage(
            stage.workflowRequestId,
            currentMainStep
          );

          if (!nextMainStage) {
            // No more stages - mark request as approved
            await stage.request!.update({
              status: WorkflowRequestStatus.APPROVED,
            });
          } else if (
            nextMainStage.stage &&
            nextMainStage.stage.requiresInternalLoop
          ) {
            // Create internal stages for next main stage
            await StageUtils.ensureInternalStagesExist(
              stage.workflowRequestId,
              nextMainStage,
              nextMainStage.stage
            );
          }
        }

        console.log("=====4=====");
      } else {
        console.log("=====5=====", stage.stage.fields);
        const stageFieldData = data?.fieldResponses?.filter(
          (field: any) => field.type === "stage"
        );

        if (stageFieldData.length > 1) {
          // Create inter-oops and return
          const stageActors: subStageActorType[] = stageFieldData.map(
            (data: any) => ({
              subStageName: String(data.label),
              assignedToUserId: Number(data.value),
            })
          );

          const baseStep = stage.step;

          await StageUtils.createInternalLoopStages(
            stage.workflowRequestId,
            stage,
            stageActors,
            baseStep
          );

          return;
        }
        // Main stage approved
        if (stage.stage!.requiresInternalLoop) {
          // Internal stages should already exist, just continue
          return;
        } else {
          // Create next main stage
          const nextMainStage = await StageUtils.createNextMainStage(
            stage.workflowRequestId,
            Number(stage.step)
          );

          console.log("=====6=====");

          if (!nextMainStage) {
            // No more stages - mark request as approved
            await stage.request!.update({
              status: WorkflowRequestStatus.APPROVED,
            });

            console.log("=====7=====");
          } else if (
            nextMainStage.stage &&
            nextMainStage.stage.requiresInternalLoop
          ) {
            console.log("=====8=====");
            // Create internal stages for next main stage
            await StageUtils.ensureInternalStagesExist(
              stage.workflowRequestId,
              nextMainStage,
              nextMainStage.stage
            );
          }
        }
      }
    } catch (error) {
      console.log("-----------------------------D-RRRR--------", error);
    }
  }

  /**
   * Sends back a stage within internal loop
   */
  static async sendBackInternalStage(
    data: InternalSendBackData & { actedByUserId: number }
  ): Promise<void> {
    await StageUtils.handleInternalRejection(
      data.stageId,
      data.comment,
      data.sentBackToRole
    );
  }
}
