import { Op } from "sequelize";
import {
  WorkflowInstanceStage,
  Stage,
  Employee,
  Department,
  Position,
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

export function getIncrementFactor(num: number) {
  // Handle non-numeric or invalid input
  if (!Number.isFinite(num)) {
    return NaN;
  }
  const parts = String(num).split(".");
  const decimalPlaces = parts.length > 1 ? parts[1].length : 0;
  return Math.pow(10, -(decimalPlaces + 1));
}

export class StageUtils {
  static async createInternalLoopStages(
    workflowRequestId: number,
    stage: WorkflowInstanceStage,
    stageActors: subStageActorType[],
    baseStep: number,
    isResubmission: boolean = false,
    parentStageId?: number
  ) {
    const incrementFactor = getIncrementFactor(Number(baseStep));
    const internalStages: WorkflowInstanceStage[] = [];
    let stepCount = Number(baseStep);

    // We need the real StageId for these subtasks. Try to use stage.stageId, NOT stage.stage?.id
    const stageId = (stage as any).stageId ?? (stage as any).stage?.id;
    if (!stageId) {
      throw new Error(
        "Invalid stage: unable to resolve stageId for internal substage creation."
      );
    }

    for (let i = 0; i < stageActors.length; i++) {
      stepCount = stepCount + incrementFactor;

      const internalStage = await WorkflowInstanceStage.create({
        workflowRequestId,
        stageName: stageActors[i].subStageName,
        step: stepCount,
        assignedToUserId: stageActors[i].assignedToUserId,
        status: WorkflowInstanceStageStatus.PENDING,
        fieldResponses: {},
        stageId,
        parentStep: parentStageId ?? stage.id,
        isSubStage: true,
        isResubmission: isResubmission,
        organizationId: stage.organizationId,
      });

      internalStages.push(internalStage);
    }
    return internalStages;
  }

  /**
   * Gets the next actionable stage for a workflow request
   */
  static async getNextStage(
    workflowRequestId: number
  ): Promise<WorkflowInstanceStage | null> {
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

    if (stages.length === 0) {
      return null;
    }
    return stages[0];
  }

  /**
   * Creates the next main stage after internal loop completion
   */
  static async createNextMainStage(
    data: any,
    stage: WorkflowInstanceStage
  ): Promise<Stage | null> {
    // Get next main stage
    const nextStage = await Stage.findOne({
      where: {
        workflowId: stage.request ? stage.request.workflowId : undefined,
        step: { [Op.gt]: stage.step },
        isSubStage: false,
      },
      order: [["step", "ASC"]],
    });

    if (!nextStage) {
      // No more stages, workflow complete
      return null;
    }

    let assignedToUserId: number | undefined;

    // Option 1: Lookup field from data.formResponses
    if (
      nextStage.assigineeLookupField &&
      data?.formResponses &&
      data.formResponses[nextStage.assigineeLookupField]
    ) {
      assignedToUserId = data.formResponses[nextStage.assigineeLookupField];
    } else if (nextStage.assigneePositionId) {
      // Option 2: Find an employee by assignee position
      const employee = await Employee.findOne({
        where: { positionId: nextStage.assigneePositionId },
      });
      if (employee) assignedToUserId = employee.id;
    } else if (stage.actedByUserId) {
      // Option 3: Use supervisor of actor
      const requestor = await Employee.findByPk(stage.actedByUserId, {
        include: [Position],
      });
      const parentPositionId = requestor?.position?.parentPositionId;
      if (parentPositionId) {
        const parentPosition = await Position.findByPk(parentPositionId, {
          include: [Employee],
        });
        const requestorParent = parentPosition?.employees?.[0];
        if (requestorParent) assignedToUserId = requestorParent.id;
      }
    }

    if (!assignedToUserId) {
      throw new Error(
        "Could not resolve an assigned user for the next stage. Please check assignment logic."
      );
    }

    await WorkflowInstanceStage.create({
      workflowRequestId: stage.workflowRequestId,
      stageName: nextStage.name,
      step: nextStage.step,
      assignedToUserId,
      status: WorkflowInstanceStageStatus.PENDING,
      fieldResponses: {},
      stageId: nextStage.id,
      organizationId: nextStage.organizationId,
      isSubStage: false,
      isResubmission: false,
      parentStep: null,
    });

    return nextStage;
  }
}
