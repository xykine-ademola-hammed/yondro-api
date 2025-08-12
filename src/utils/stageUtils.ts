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
  static async createInternalLoopStages(
    workflowRequestId: number,
    stage: WorkflowInstanceStage,
    stageActors: subStageActorType[],
    baseStep: number,
    isResubmition: boolean = false,
    parentStageId?: number
  ) {
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

    if (stages.length === 0) {
      return null;
    }

    // Return the first pending stage (lowest step number)
    return stages[0];
  }

  /**
   * Creates the next main stage after internal loop completion
   */
  static async createNextMainStage(
    data: any,
    stage: WorkflowInstanceStage
  ): Promise<Stage | null> {
    console.log("---------------END------1-------------------------");
    // Main stage approved
    // Get next main stage from workflow
    const nextStage = await Stage.findOne({
      where: {
        workflowId: stage.request.workflowId,
        step: { [Op.gt]: stage.step },
        isSubStage: false,
      },
      order: [["step", "ASC"]],
    });

    console.log(
      "---------------END------2-------------------------",
      nextStage
    );

    if (!nextStage) {
      // No more stages - mark request as approved
      return null;
    }

    console.log(
      "---------------END------3-------------------------",
      nextStage
    );

    let assignedToUserId: number = data.actedByUserId;

    // check if the second stage need an employee to be assigned
    if (nextStage?.assigineeLookupField && data?.formResponses) {
      assignedToUserId = data?.formResponses[nextStage?.assigineeLookupField];
    } else {
      const subStageEmployee = await Employee.findOne({
        where: {
          departmentId: nextStage?.assigneeDepartmentId,
          positionId: nextStage?.assigneePositionId,
        },
      });
      if (subStageEmployee) assignedToUserId = subStageEmployee?.id;
    }

    await WorkflowInstanceStage.create({
      ...nextStage,
      stageName: nextStage.name,
      step: nextStage.step,
      workflowRequestId: stage.workflowRequestId,
      assignedToUserId,
      status: WorkflowInstanceStageStatus.PENDING,
      fieldResponses: {},
      stageId: nextStage.id,
      organizationId: nextStage.organizationId,
    });

    return nextStage;
  }
}
