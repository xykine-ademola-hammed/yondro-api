"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowExecutionService = void 0;
const models_1 = require("../models");
const types_1 = require("../types");
const stageUtils_1 = require("../utils/stageUtils");
const sequelize_1 = require("sequelize");
class WorkflowExecutionService {
    static async startWorkflowRequest(workflowId, requestorId, actedByUserId, formResponses, user) {
        const workflow = await models_1.Workflow.findByPk(workflowId, {
            include: [
                {
                    model: models_1.Stage,
                    as: "stages",
                    order: [["step", "ASC"]],
                },
            ],
            order: [
                ["createdAt", "DESC"],
                [{ model: models_1.Stage, as: "stages" }, "step", "ASC"],
            ],
        });
        if (!workflow || !workflow.stages || workflow.stages.length === 0) {
            throw new Error("Workflow not found or has no initial stage");
        }
        const firstStage = workflow.stages[0];
        const workflowRequest = await models_1.WorkflowRequest.create({
            formId: workflow.formId,
            formResponses: {
                ...formResponses,
                requestor: {
                    firstName: user.firstName,
                    lastName: user.lastName,
                    date: new Date(),
                    department: user.department.name,
                    position: user.position.title,
                },
            },
            workflowId,
            requestorId,
            organizationId: workflow.organizationId,
            status: types_1.WorkflowRequestStatus.PENDING,
            createdBy: actedByUserId || user.id,
        });
        console.log("```Workflow request created:", workflowRequest.id);
        let assignedToUserId = user.id;
        const firstInstanceStage = await models_1.WorkflowInstanceStage.create({
            workflowRequestId: workflowRequest.id,
            stageName: firstStage?.name,
            step: firstStage.step,
            assignedToUserId,
            status: types_1.WorkflowInstanceStageStatus.SUBMITTED,
            fieldResponses: firstStage.formFields.map((field) => ({
                field: formResponses[field],
            })),
            stageId: firstStage.id,
            isSubStage: false,
            isResubmission: false,
            actedByUserId,
            organizationId: workflow.organizationId,
        });
        console.log("```222-----Workflow request created:", assignedToUserId);
        if (firstStage.isSubStage) {
        }
        else {
            let secondStage = workflow.stages[1];
            if (user.position.hierarchyLevel === 3) {
                await models_1.WorkflowInstanceStage.create({
                    workflowRequestId: workflowRequest.id,
                    stageName: secondStage.name,
                    step: secondStage.step,
                    assignedToUserId: actedByUserId,
                    status: types_1.WorkflowInstanceStageStatus.APPROVED,
                    fieldResponses: {},
                    stageId: secondStage.id,
                    isSubStage: false,
                    isResubmission: false,
                    actedByUserId,
                    organizationId: workflow.organizationId,
                });
                secondStage = workflow.stages[2];
            }
            let assignedToUserId;
            const requestorParent = await this.getRequestorParent(requestorId);
            if (requestorParent) {
                assignedToUserId = requestorParent.id;
            }
            if (secondStage.assigineeLookupField) {
                assignedToUserId = formResponses[secondStage.assigineeLookupField];
            }
            else if (secondStage.assigneePositionId) {
                const nextStageemployee = await models_1.Employee.findOne({
                    where: {
                        positionId: secondStage.assigneePositionId,
                    },
                });
                if (nextStageemployee)
                    assignedToUserId = nextStageemployee?.id;
            }
            console.log("``3333`Workflow assignedToUserId", assignedToUserId);
            await models_1.WorkflowInstanceStage.create({
                workflowRequestId: workflowRequest.id,
                stageName: secondStage.name,
                step: secondStage.step,
                assignedToUserId,
                status: types_1.WorkflowInstanceStageStatus.PENDING,
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
    static async getRequestorParent(requestorId) {
        const requestor = await models_1.Employee.findByPk(requestorId, {
            include: [models_1.Position],
        });
        const parentPosition = await models_1.Position.findByPk(requestor?.position.parentPositionId, { include: [models_1.Employee] });
        console.log("-----0.1--------", parentPosition?.employees);
        const requestorParent = parentPosition?.employees[0];
        return requestorParent;
    }
    static async getNextStage(requestId) {
        const workflowRequest = await models_1.WorkflowRequest.findByPk(requestId);
        if (!workflowRequest) {
            throw new Error("Workflow request not found");
        }
        if (workflowRequest.status !== types_1.WorkflowRequestStatus.PENDING) {
            return {
                currentStage: null,
                isComplete: true,
                requiresAction: false,
            };
        }
        const nextStage = await stageUtils_1.StageUtils.getNextStage(requestId);
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
            requiresAction: nextStage.status === types_1.WorkflowInstanceStageStatus.PENDING,
        };
    }
    static async completeStage(data) {
        try {
            const stage = await models_1.WorkflowInstanceStage.findByPk(data.stageId, {
                include: [
                    { model: models_1.Stage, as: "stage" },
                    { model: models_1.WorkflowRequest, as: "request", include: [models_1.Workflow] },
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
            });
            const [affectedRows] = await models_1.WorkflowRequest.update({ formResponses: { ...data.formResponses, approvers } }, {
                where: { id: stage.workflowRequestId },
            });
            if (affectedRows !== 1) {
                console.log("Handle error: no record or multiple records updated");
            }
            if (stage.status !== types_1.WorkflowInstanceStageStatus.PENDING) {
                throw new Error("Stage is not in pending status");
            }
            const newStatus = data.action === "Approve"
                ? types_1.WorkflowInstanceStageStatus.APPROVED
                : types_1.WorkflowInstanceStageStatus.REJECTED;
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
                    const siblingStages = await models_1.WorkflowInstanceStage.findAll({
                        where: {
                            workflowRequestId: stage.workflowRequestId,
                            parentStep: stage.parentStep,
                            step: {
                                [sequelize_1.Op.lte]: stage.step,
                            },
                            isSubStage: true,
                            status: { [sequelize_1.Op.ne]: "Pending" },
                        },
                        order: [["step", "ASC"]],
                    });
                    if (siblingStages.length > 0) {
                        for (let i = 0; i < siblingStages.length; i++) {
                            await siblingStages[i].update({
                                isResubmission: true,
                            });
                            await models_1.WorkflowInstanceStage.create({
                                isSubStage: true,
                                isResubmission: false,
                                stageName: siblingStages[i]?.stageName,
                                step: siblingStages[i].step,
                                parentStep: siblingStages[i].parentStep,
                                workflowRequestId: stage.workflowRequestId,
                                assignedToUserId: siblingStages[i].assignedToUserId,
                                status: types_1.WorkflowInstanceStageStatus.PENDING,
                                fieldResponses: {},
                                stageId: siblingStages[i].stageId,
                                organizationId: siblingStages[i].organizationId,
                            });
                        }
                    }
                }
                else {
                    await stage.request.update({
                        status: types_1.WorkflowRequestStatus.REJECTED,
                    });
                }
                return;
            }
            if (stage.isSubStage) {
                const siblingStages = await models_1.WorkflowInstanceStage.findAll({
                    where: {
                        workflowRequestId: stage.workflowRequestId,
                        parentStep: stage.parentStep,
                        isSubStage: true,
                    },
                    order: [
                        ["step", "DESC"],
                        ["createdAt", "DESC"],
                    ],
                });
                const isLastSubStage = siblingStages[0].id === stage.id;
                if (isLastSubStage) {
                    const nextStage = await stageUtils_1.StageUtils.createNextMainStage(data, stage);
                    if (!nextStage) {
                        await stage.request.update({
                            status: types_1.WorkflowRequestStatus.APPROVED,
                        });
                    }
                }
                return;
            }
            else {
                const subStages = await models_1.Stage.findAll({
                    where: {
                        workflowId: stage.request.workflowId,
                        parentStep: Number(stage.step),
                        isSubStage: true,
                    },
                    order: [["step", "ASC"]],
                });
                if (subStages.length > 0) {
                    for (let i = 0; i < subStages.length; i++) {
                        let assignedToUserId = data.actedByUserId;
                        if (subStages[i].assigineeLookupField &&
                            data?.formResponses &&
                            data?.formResponses[subStages[i].assigineeLookupField]) {
                            assignedToUserId =
                                data?.formResponses[subStages[i].assigineeLookupField];
                        }
                        else {
                            const subStageEmployee = await models_1.Employee.findOne({
                                where: {
                                    positionId: subStages[i].assigneePositionId,
                                },
                            });
                            if (subStageEmployee)
                                assignedToUserId = subStageEmployee?.id;
                        }
                        await models_1.WorkflowInstanceStage.create({
                            ...subStages[i],
                            isSubStage: true,
                            isResubmission: false,
                            stageName: subStages[i].name,
                            step: subStages[i].step,
                            parentStep: subStages[i].parentStep,
                            workflowRequestId: stage.workflowRequestId,
                            assignedToUserId,
                            status: types_1.WorkflowInstanceStageStatus.PENDING,
                            fieldResponses: {},
                            stageId: subStages[i].id,
                            organizationId: subStages[i].organizationId,
                        });
                    }
                }
                else {
                    const nextStage = await stageUtils_1.StageUtils.createNextMainStage(data, stage);
                    if (!nextStage) {
                        await models_1.WorkflowRequest.update({ status: types_1.WorkflowRequestStatus.APPROVED }, {
                            where: {
                                id: stage.request.id,
                            },
                        });
                    }
                    return;
                }
            }
        }
        catch (error) {
            console.log("-----------------------------D-RRRR--------", error);
        }
    }
}
exports.WorkflowExecutionService = WorkflowExecutionService;
//# sourceMappingURL=WorkflowExecutionService.js.map