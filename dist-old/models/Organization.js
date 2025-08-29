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
exports.Organization = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const Department_1 = require("./Department");
const Position_1 = require("./Position");
const Employee_1 = require("./Employee");
const Workflow_1 = require("./Workflow");
const Stage_1 = require("./Stage");
const WorkflowRequest_1 = require("./WorkflowRequest");
const WorkflowInstanceStage_1 = require("./WorkflowInstanceStage");
let Organization = class Organization extends sequelize_typescript_1.Model {
};
exports.Organization = Organization;
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    }),
    __metadata("design:type", Number)
], Organization.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
        allowNull: false,
        unique: true,
    }),
    __metadata("design:type", String)
], Organization.prototype, "name", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
        allowNull: true,
    }),
    __metadata("design:type", String)
], Organization.prototype, "description", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        defaultValue: true,
    }),
    __metadata("design:type", Boolean)
], Organization.prototype, "isActive", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], Organization.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], Organization.prototype, "updatedAt", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => Department_1.Department),
    __metadata("design:type", Array)
], Organization.prototype, "departments", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => Position_1.Position),
    __metadata("design:type", Array)
], Organization.prototype, "positions", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => Employee_1.Employee),
    __metadata("design:type", Array)
], Organization.prototype, "employees", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => Workflow_1.Workflow),
    __metadata("design:type", Array)
], Organization.prototype, "workflows", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => Stage_1.Stage),
    __metadata("design:type", Array)
], Organization.prototype, "stages", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => WorkflowRequest_1.WorkflowRequest),
    __metadata("design:type", Array)
], Organization.prototype, "workflowRequests", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => WorkflowInstanceStage_1.WorkflowInstanceStage),
    __metadata("design:type", Array)
], Organization.prototype, "workflowInstanceStages", void 0);
exports.Organization = Organization = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: "organizations",
        timestamps: true,
        underscored: true,
    })
], Organization);
//# sourceMappingURL=Organization.js.map