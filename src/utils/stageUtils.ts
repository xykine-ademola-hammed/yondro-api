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
import {
  WorkflowInstanceStageStatus,
  InternalStageRole,
  WorkflowRequestStatus,
} from "../types";

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
        status: [WorkflowInstanceStageStatus.PENDING],
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

  static async getLastStage(
    workflowRequestId: number
  ): Promise<WorkflowInstanceStage | null> {
    const stages = await WorkflowInstanceStage.findAll({
      where: {
        workflowRequestId,
        status: { [Op.ne]: WorkflowInstanceStageStatus.PENDING },
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
      order: [["step", "DESC"]],
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

    // Check if the stage of the stateInstance require creation of request for Voucher Creation.
    // and workFlow not six to prevent creating another workFlowRequest
    if (stage.stage.trigerVoucherCreation && stage.stage.workflowId !== 6) {
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

      console.error("----------------HERE-------", data.user.id);

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

    console.error("=========NEXT==SAGE==1======", nextStage);

    console.error("=======WHERE=======", {
      workflowId: stage.request ? stage.request.workflowId : undefined,
      step: { [Op.gt]: stage.step },
      isSubStage: false,
    });

    console.error("=========NEXT==SAGE==2======", nextStage);

    if (!nextStage || nextStage === null) {
      // No more stages, workflow complete
      return null;
    }

    console.error("=========NEXT==SAGE==3======", nextStage);

    let assignedToUserId: number | undefined;

    // Option 0: Lookup field from split positions assignement
    if (
      Array.isArray(nextStage?.splitPositions) &&
      nextStage?.splitPositions?.length > 0
    ) {
      let positionId;
      if (data.action === "Payment") {
        positionId = nextStage?.splitPositions?.find(
          (splitPosition: any) => splitPosition.marker === "Approve for payment"
        )?.id;
      }
      if (data.action === "Procurement") {
        positionId = nextStage?.splitPositions?.find(
          (splitPosition: any) =>
            splitPosition.marker === "Approve for procurement"
        )?.id;
      }

      if (positionId) {
        const position = await Position.findByPk(positionId, {
          include: [Employee],
        });
        const selectedEmployee = position?.employees?.[0];
        if (selectedEmployee) assignedToUserId = selectedEmployee.id;
      }
    } else if (
      // Option 1: Lookup field from data.formResponses
      nextStage.assigineeLookupField &&
      data?.formResponses &&
      data.formResponses[nextStage.assigineeLookupField]
    ) {
      console.error("=========NEXT==SAGE==4======");
      assignedToUserId = data.formResponses[nextStage.assigineeLookupField];
    } else if (nextStage.assigneePositionId) {
      console.error(
        "=========NEXT==SAGE==5======",
        nextStage.assigneePositionId
      );
      // Option 2: Find an employee by assignee position
      const employee = await Employee.findOne({
        where: { positionId: nextStage.assigneePositionId },
      });
      if (employee) assignedToUserId = employee.id;
    } else if (stage.actedByUserId) {
      console.error("=========NEXT==SAGE==6======", stage.actedByUserId);
      // Option 3: Use supervisor of actor
      const requestor = await Employee.findByPk(stage.actedByUserId, {
        include: [Position],
      });
      const parentPositionId = requestor?.position?.parentPositionId;
      console.error("---------ParentPositionId-----", parentPositionId);
      if (parentPositionId) {
        const parentPosition = await Position.findByPk(parentPositionId, {
          include: [Employee],
        });

        console.error("---------Parent-----Position-----", parentPosition);

        const requestorParent = parentPosition?.employees?.[0];

        console.error("------Requestor---Parent-----", requestorParent);

        if (requestorParent) {
          assignedToUserId = requestorParent.id;

          console.error("------assignedToUserId-----", assignedToUserId);
        }
      }
    }

    if (!assignedToUserId) {
      console.error(
        "Could not resolve an assigned user for the next stage. Please check assignment logic."
      );
      throw new Error(
        "Could not resolve an assigned user for the next stage. Please check assignment logic."
      );
    }

    const createData = {
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
    };

    await WorkflowInstanceStage.create(createData);

    return nextStage;
  }
}
