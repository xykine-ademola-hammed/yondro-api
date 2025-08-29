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
exports.WorkflowRequest = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const Organization_1 = require("./Organization");
const Workflow_1 = require("./Workflow");
const Employee_1 = require("./Employee");
const WorkflowInstanceStage_1 = require("./WorkflowInstanceStage");
const types_1 = require("../types");
let WorkflowRequest = class WorkflowRequest extends sequelize_typescript_1.Model {
};
exports.WorkflowRequest = WorkflowRequest;
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    }),
    __metadata("design:type", Number)
], WorkflowRequest.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Organization_1.Organization),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], WorkflowRequest.prototype, "organizationId", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Workflow_1.Workflow),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], WorkflowRequest.prototype, "workflowId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], WorkflowRequest.prototype, "formId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSON,
        defaultValue: {},
    }),
    __metadata("design:type", Object)
], WorkflowRequest.prototype, "formResponses", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        allowNull: true,
    }),
    __metadata("design:type", String)
], WorkflowRequest.prototype, "approvedFormUrl", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Employee_1.Employee),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], WorkflowRequest.prototype, "requestorId", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Employee_1.Employee),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], WorkflowRequest.prototype, "createdBy", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ENUM(...Object.values(types_1.WorkflowRequestStatus)),
        defaultValue: types_1.WorkflowRequestStatus.PENDING,
    }),
    __metadata("design:type", String)
], WorkflowRequest.prototype, "status", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], WorkflowRequest.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], WorkflowRequest.prototype, "updatedAt", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => Organization_1.Organization),
    __metadata("design:type", Organization_1.Organization)
], WorkflowRequest.prototype, "organization", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => Workflow_1.Workflow),
    __metadata("design:type", Workflow_1.Workflow)
], WorkflowRequest.prototype, "workflow", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => Employee_1.Employee, "requestorId"),
    __metadata("design:type", Employee_1.Employee)
], WorkflowRequest.prototype, "requestor", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => WorkflowInstanceStage_1.WorkflowInstanceStage),
    __metadata("design:type", Array)
], WorkflowRequest.prototype, "stages", void 0);
exports.WorkflowRequest = WorkflowRequest = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: "workflow_requests",
        timestamps: true,
        underscored: true,
    })
], WorkflowRequest);
//# sourceMappingURL=WorkflowRequest.js.map