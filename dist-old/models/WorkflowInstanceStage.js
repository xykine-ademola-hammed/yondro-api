"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowInstanceStage = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const Organization_1 = require("./Organization");
const WorkflowRequest_1 = require("./WorkflowRequest");
const Employee_1 = require("./Employee");
const Stage_1 = require("./Stage");
const types_1 = require("../types");
let WorkflowInstanceStage = class WorkflowInstanceStage extends sequelize_typescript_1.Model {
};
exports.WorkflowInstanceStage = WorkflowInstanceStage;
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    }),
    __metadata("design:type", Number)
], WorkflowInstanceStage.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Organization_1.Organization),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], WorkflowInstanceStage.prototype, "organizationId", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => WorkflowRequest_1.WorkflowRequest),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], WorkflowInstanceStage.prototype, "workflowRequestId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
        allowNull: false,
    }),
    __metadata("design:type", String)
], WorkflowInstanceStage.prototype, "stageName", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DECIMAL(10, 4),
        allowNull: false,
    }),
    __metadata("design:type", Number)
], WorkflowInstanceStage.prototype, "step", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Employee_1.Employee),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], WorkflowInstanceStage.prototype, "assignedToUserId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ENUM(...Object.values(types_1.WorkflowInstanceStageStatus)),
        defaultValue: types_1.WorkflowInstanceStageStatus.PENDING,
    }),
    __metadata("design:type", String)
], WorkflowInstanceStage.prototype, "status", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSON,
        defaultValue: {},
    }),
    __metadata("design:type", Object)
], WorkflowInstanceStage.prototype, "fieldResponses", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Stage_1.Stage),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], WorkflowInstanceStage.prototype, "stageId", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => WorkflowInstanceStage),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: true,
    }),
    __metadata("design:type", Number)
], WorkflowInstanceStage.prototype, "parentStep", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        defaultValue: false,
    }),
    __metadata("design:type", Boolean)
], WorkflowInstanceStage.prototype, "isSubStage", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        defaultValue: false,
    }),
    __metadata("design:type", Boolean)
], WorkflowInstanceStage.prototype, "isResubmission", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => WorkflowInstanceStage),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: true,
    }),
    __metadata("design:type", Number)
], WorkflowInstanceStage.prototype, "sentBackToStageId", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Employee_1.Employee),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: true,
    }),
    __metadata("design:type", Number)
], WorkflowInstanceStage.prototype, "actedByUserId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        allowNull: true,
    }),
    __metadata("design:type", Date)
], WorkflowInstanceStage.prototype, "actedAt", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
        allowNull: true,
    }),
    __metadata("design:type", String)
], WorkflowInstanceStage.prototype, "comment", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], WorkflowInstanceStage.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], WorkflowInstanceStage.prototype, "updatedAt", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => Organization_1.Organization),
    __metadata("design:type", Organization_1.Organization)
], WorkflowInstanceStage.prototype, "organization", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => WorkflowRequest_1.WorkflowRequest, "workflowRequestId"),
    __metadata("design:type", WorkflowRequest_1.WorkflowRequest)
], WorkflowInstanceStage.prototype, "request", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => Employee_1.Employee, "assignedToUserId"),
    __metadata("design:type", Employee_1.Employee)
], WorkflowInstanceStage.prototype, "assignedTo", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => Employee_1.Employee, "actedByUserId"),
    __metadata("design:type", Employee_1.Employee)
], WorkflowInstanceStage.prototype, "actedBy", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => Stage_1.Stage),
    __metadata("design:type", Stage_1.Stage)
], WorkflowInstanceStage.prototype, "stage", void 0);
exports.WorkflowInstanceStage = WorkflowInstanceStage = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: "workflow_instance_stages",
        timestamps: true,
        underscored: true,
    })
], WorkflowInstanceStage);
//# sourceMappingURL=WorkflowInstanceStage.js.map