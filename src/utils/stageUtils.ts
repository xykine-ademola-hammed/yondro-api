import { Op } from "sequelize";
import {
  WorkflowInstanceStage,
  Stage,
  Employee,
  Department,
  Position,
  WorkflowRequest,
  Workflow,
} from "../models";
import { WorkflowInstanceStageStatus, InternalStageRole } from "../types";

export interface subStageMembersInputType {
  id: number;
  role: InternalStageRole;
}

export interface subStageActorType {
  assignedToUserId: number;
  subStageName: string;
}

export function getIncrementFactor(number: number) {
  // Handle non-numeric or invalid input
  if (!Number.isFinite(number)) {
    return NaN;
  }

  // Convert to string and split on decimal point
  const parts = String(number).split(".");
  // Get the number of decimal places (0 if no decimal part)
  const decimalPlaces = parts.length > 1 ? parts[1].length : 0;

  // Calculate increment factor as 10^(-(decimalPlaces + 1))
  return Math.pow(10, -(decimalPlaces + 1));
}

export class StageUtils {
  /**
   * Ensures internal stages exist for a main stage that requires them
   */
  static async ensureInternalStagesExist(
    workflowRequestId: number,
    parentStage: WorkflowInstanceStage,
    stage: Stage,
    subStageMembersInput?: subStageMembersInputType[]
  ): Promise<WorkflowInstanceStage[]> {
    if (!stage.requiresInternalLoop || !stage.departmentId) {
      return [];
    }

    // Check if internal stages already exist
    const existingInternalStages = await WorkflowInstanceStage.findAll({
      where: {
        workflowRequestId,
        parentStageId: parentStage.id,
        isSubStage: true,
      },
      order: [["step", "ASC"]],
    });

    if (existingInternalStages.length > 0) {
      return existingInternalStages;
    }

    // Create internal stages: Initiator, Reviewer, Approver
    const internalRoles = [
      InternalStageRole.INITIATOR,
      InternalStageRole.REVIEWER,
      InternalStageRole.APPROVER,
    ];

    const internalStages: WorkflowInstanceStage[] = [];
    const baseStep = parentStage.step;

    for (let i = 0; i < internalRoles.length; i++) {
      const role = internalRoles[i];
      const subStep = parseFloat(
        `${baseStep}.${String(i + 1).padStart(2, "0")}`
      );

      const assignedUserId = subStageMembersInput?.find(
        (member) => member.role === role
      )?.id;

      const internalStage = await WorkflowInstanceStage.create({
        workflowRequestId,
        stageName: `${stage.name} - ${role}`,
        step: subStep,
        assignedToUserId: assignedUserId,
        status:
          i === 0
            ? WorkflowInstanceStageStatus.PENDING
            : WorkflowInstanceStageStatus.CREATED,
        fieldResponses: {},
        stageId: stage.id,
        parentStageId: parentStage.id,
        isSubStage: true,
        isResubmission: false,
      });

      internalStages.push(internalStage);
    }

    return internalStages;
  }

  // Improve on this
  // add new arg, baseStep, increamentFactor, isResubmition
  // standardize the stageActors
  // { assignedToUserId, subStageName
  // }[]
  static async createInternalLoopStages(
    workflowRequestId: number,
    stage: WorkflowInstanceStage,
    stageActors: subStageActorType[],
    baseStep: number,
    isResubmition: boolean = false,
    parentStageId?: number
  ) {
    console.log("------------STAGEEEEE---------", stage.step);

    const increamentFactor = getIncrementFactor(Number(baseStep));
    const internalStages: WorkflowInstanceStage[] = [];
    let stepCount = Number(baseStep);

    for (let i = 0; i < stageActors.length; i++) {
      stepCount = stepCount + increamentFactor;

      const internalStage = await WorkflowInstanceStage.create({
        workflowRequestId,
        stageName: stageActors[i].subStageName,
        step: stepCount,
        assignedToUserId: stageActors[i].assignedToUserId,
        status:
          i === 0
            ? WorkflowInstanceStageStatus.PENDING
            : WorkflowInstanceStageStatus.PENDING,
        fieldResponses: {},
        stageId: stage.stage.id,
        parentStageId: parentStageId ?? stage.id,
        isSubStage: true,
        isResubmission: isResubmition,
        organizationId: stage.organizationId,
      });

      internalStages.push(internalStage);
    }
  }

  /**
   * Gets the next actionable stage for a workflow request
   */
  static async getNextStage(
    workflowRequestId: number
  ): Promise<WorkflowInstanceStage | null> {
    // Get all stages ordered by step
    const stages = await WorkflowInstanceStage.findAll({
      where: {
        workflowRequestId,
        status: WorkflowInstanceStageStatus.PENDING,
      },
      include: [
        {
          model: Employee,
          as: "assignedTo",
          include: [
            { model: Department, as: "department" },
            { model: Position, as: "position" },
          ],
        },
        {
          model: Stage,
          as: "stage",
        },
      ],
      order: [["step", "ASC"]],
    });

    console.log("-----stages-----------888888", stages);

    if (stages.length === 0) {
      return null;
    }

    // Return the first pending stage (lowest step number)
    return stages[0];
  }

  /**
   * Handles rejection within internal loop - creates new stages for resubmission
   */
  static async handleInternalRejection(
    stageId: number,
    comment: string,
    sentBackToRole: InternalStageRole // this always be initiator //
  ): Promise<void> {
    const rejectedStage = await WorkflowInstanceStage.findByPk(stageId, {
      include: [{ model: Stage, as: "stage" }],
    });

    if (!rejectedStage || !rejectedStage.isSubStage) {
      throw new Error("Invalid stage for internal rejection");
    }

    // Mark current stage as rejected
    await rejectedStage.update({
      status: WorkflowInstanceStageStatus.REJECTED,
      comment,
      actedAt: new Date(),
    });

    // Get the parent stage and its department
    const parentStage = await WorkflowInstanceStage.findByPk(
      rejectedStage.parentStageId!
    );
    const stage = rejectedStage.stage!;

    if (!parentStage || !stage.departmentId) {
      throw new Error("Invalid parent stage or department");
    }

    // Find the highest sub-step for this parent stage
    const maxSubStep =
      ((await WorkflowInstanceStage.max("step", {
        where: {
          workflowRequestId: rejectedStage.workflowRequestId,
          parentStageId: rejectedStage.parentStageId,
          isSubStage: true,
        },
      })) as number) || parentStage.step;

    // Create new initiator stage
    const newInitiatorStep =
      Math.floor(maxSubStep) + 0.01 * (Math.floor((maxSubStep % 1) * 100) + 1);
    const initiatorUserId = await this.assignNextUserFromDepartment(
      stage.departmentId
    );

    await WorkflowInstanceStage.create({
      workflowRequestId: rejectedStage.workflowRequestId,
      stageName: `${stage.name} - ${InternalStageRole.INITIATOR} (Resubmission)`,
      step: newInitiatorStep,
      assignedToUserId: initiatorUserId,
      status: WorkflowInstanceStageStatus.PENDING,
      fieldResponses: {},
      stageId: stage.id,
      parentStageId: rejectedStage.parentStageId,
      isSubStage: true,
      isResubmission: true,
      sentBackToStageId: stageId,
    });

    // Create the role that was sent back to (if not Initiator)
    if (sentBackToRole !== InternalStageRole.INITIATOR) {
      const reviewRoleStep = newInitiatorStep + 0.01;
      const reviewUserId = await this.assignNextUserFromDepartment(
        stage.departmentId
      );

      await WorkflowInstanceStage.create({
        workflowRequestId: rejectedStage.workflowRequestId,
        stageName: `${stage.name} - ${sentBackToRole} (Re-review)`,
        step: reviewRoleStep,
        assignedToUserId: reviewUserId,
        status: WorkflowInstanceStageStatus.PENDING,
        fieldResponses: {},
        stageId: stage.id,
        parentStageId: rejectedStage.parentStageId,
        isSubStage: true,
        isResubmission: true,
        sentBackToStageId: stageId,
      });
    }
  }

  /**
   * Creates the next main stage after internal loop completion
   */
  static async createNextMainStage(
    workflowRequestId: number,
    currentMainStep: number
  ): Promise<WorkflowInstanceStage | null> {
    console.log("=====5.1=====", currentMainStep);
    // Get the workflow and its stages
    const workflowRequest = await WorkflowRequest.findOne({
      where: { id: workflowRequestId },
      include: [Workflow],
    });

    console.log("=====5.2=====");

    if (!workflowRequest) {
      return null;
    }

    console.log("=====5.3=====");

    // Find next stage in workflow
    const nextMainStep = currentMainStep + 1;
    const nextStage = await Stage.findOne({
      where: {
        workflowId: workflowRequest.workflow.id,
        step: nextMainStep,
      },
    });

    const currentStageResponse = await WorkflowInstanceStage.findOne({
      where: {
        workflowRequestId: workflowRequest.id,
        step: currentMainStep,
      },
    });

    console.log("=====5.4=====");

    if (!nextStage) {
      return null; // No more stages
    }

    console.log("=====5.5=====", nextStage.assignee);

    console.log("uuuuuuuuuuuuuuuuuuuu", currentStageResponse?.fieldResponses);

    let assignedUser;

    // Check if the responses has stage to assign user to next stage
    const stageActor = currentStageResponse?.fieldResponses.find(
      (field: any) => (field.type = "stage")
    );

    // Check if the next stage has it own assign user params
    const { departmentId, positionId } = nextStage.assignee;
    console.log("--nextStage.assignee-----", nextStage.assignee);
    if (departmentId && positionId)
      assignedUser = await Employee.findOne({
        where: { departmentId, positionId },
      });

    // Create next main stage
    const nextMainStage = await WorkflowInstanceStage.create({
      workflowRequestId,
      stageName: nextStage.name,
      step: nextMainStep,
      assignedToUserId: stageActor?.value ?? assignedUser?.id,
      status: WorkflowInstanceStageStatus.PENDING,
      fieldResponses: {},
      stageId: nextStage.id,
      isSubStage: false,
      isResubmission: false,
      organizationId: workflowRequest.organizationId,
    });

    console.log("=====5.5=====", nextMainStage);

    return nextMainStage;
  }
}
