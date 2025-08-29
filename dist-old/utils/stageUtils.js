"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StageUtils = void 0;
exports.getIncrementFactor = getIncrementFactor;
const sequelize_1 = require("sequelize");
const models_1 = require("../models");
const types_1 = require("../types");
function getIncrementFactor(num) {
    if (!Number.isFinite(num)) {
        return NaN;
    }
    const parts = String(num).split(".");
    const decimalPlaces = parts.length > 1 ? parts[1].length : 0;
    return Math.pow(10, -(decimalPlaces + 1));
}
class StageUtils {
    static async createInternalLoopStages(workflowRequestId, stage, stageActors, baseStep, isResubmission = false, parentStageId) {
        const incrementFactor = getIncrementFactor(Number(baseStep));
        const internalStages = [];
        let stepCount = Number(baseStep);
        const stageId = stage.stageId ?? stage.stage?.id;
        if (!stageId) {
            throw new Error("Invalid stage: unable to resolve stageId for internal substage creation.");
        }
        for (let i = 0; i < stageActors.length; i++) {
            stepCount = stepCount + incrementFactor;
            const internalStage = await models_1.WorkflowInstanceStage.create({
                workflowRequestId,
                stageName: stageActors[i].subStageName,
                step: stepCount,
                assignedToUserId: stageActors[i].assignedToUserId,
                status: types_1.WorkflowInstanceStageStatus.PENDING,
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
    static async getNextStage(workflowRequestId) {
        const stages = await models_1.WorkflowInstanceStage.findAll({
            where: {
                workflowRequestId,
                status: types_1.WorkflowInstanceStageStatus.PENDING,
            },
            include: [
                {
                    model: models_1.Employee,
                    as: "assignedTo",
                    include: [
                        { model: models_1.Department, as: "department" },
                        { model: models_1.Position, as: "position" },
                    ],
                },
                {
                    model: models_1.Stage,
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
    static async createNextMainStage(data, stage) {
        const nextStage = await models_1.Stage.findOne({
            where: {
                workflowId: stage.request ? stage.request.workflowId : undefined,
                step: { [sequelize_1.Op.gt]: stage.step },
                isSubStage: false,
            },
            order: [["step", "ASC"]],
        });
        if (!nextStage) {
            return null;
        }
        let assignedToUserId;
        if (nextStage.assigineeLookupField &&
            data?.formResponses &&
            data.formResponses[nextStage.assigineeLookupField]) {
            assignedToUserId = data.formResponses[nextStage.assigineeLookupField];
        }
        else if (nextStage.assigneePositionId) {
            const employee = await models_1.Employee.findOne({
                where: { positionId: nextStage.assigneePositionId },
            });
            if (employee)
                assignedToUserId = employee.id;
        }
        else if (stage.actedByUserId) {
            const requestor = await models_1.Employee.findByPk(stage.actedByUserId, {
                include: [models_1.Position],
            });
            const parentPositionId = requestor?.position?.parentPositionId;
            if (parentPositionId) {
                const parentPosition = await models_1.Position.findByPk(parentPositionId, {
                    include: [models_1.Employee],
                });
                const requestorParent = parentPosition?.employees?.[0];
                if (requestorParent)
                    assignedToUserId = requestorParent.id;
            }
        }
        if (!assignedToUserId) {
            throw new Error("Could not resolve an assigned user for the next stage. Please check assignment logic.");
        }
        await models_1.WorkflowInstanceStage.create({
            workflowRequestId: stage.workflowRequestId,
            stageName: nextStage.name,
            step: nextStage.step,
            assignedToUserId,
            status: types_1.WorkflowInstanceStageStatus.PENDING,
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
exports.StageUtils = StageUtils;
//# sourceMappingURL=stageUtils.js.map