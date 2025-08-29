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
exports.Position = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const Organization_1 = require("./Organization");
const Department_1 = require("./Department");
const Employee_1 = require("./Employee");
const EmployeePosition_1 = require("./EmployeePosition");
const Unit_1 = require("./Unit");
const SchoolOrOffice_1 = require("./SchoolOrOffice");
let Position = class Position extends sequelize_typescript_1.Model {
};
exports.Position = Position;
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    }),
    __metadata("design:type", Number)
], Position.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Organization_1.Organization),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], Position.prototype, "organizationId", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => SchoolOrOffice_1.SchoolOrOffice),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: true,
    }),
    __metadata("design:type", Number)
], Position.prototype, "schoolOrOfficeId", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Department_1.Department),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: true,
    }),
    __metadata("design:type", Number)
], Position.prototype, "departmentId", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Unit_1.Unit),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: true,
    }),
    __metadata("design:type", Number)
], Position.prototype, "unitId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
        allowNull: false,
    }),
    __metadata("design:type", String)
], Position.prototype, "title", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
        allowNull: true,
    }),
    __metadata("design:type", String)
], Position.prototype, "description", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        defaultValue: true,
    }),
    __metadata("design:type", Boolean)
], Position.prototype, "isActive", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Position),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: true,
    }),
    __metadata("design:type", Number)
], Position.prototype, "parentPositionId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 1,
    }),
    __metadata("design:type", Number)
], Position.prototype, "hierarchyLevel", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
        allowNull: true,
    }),
    __metadata("design:type", String)
], Position.prototype, "hierarchyPath", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], Position.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], Position.prototype, "updatedAt", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => Organization_1.Organization),
    __metadata("design:type", Organization_1.Organization)
], Position.prototype, "organization", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => Department_1.Department),
    __metadata("design:type", Department_1.Department)
], Position.prototype, "department", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => SchoolOrOffice_1.SchoolOrOffice),
    __metadata("design:type", SchoolOrOffice_1.SchoolOrOffice)
], Position.prototype, "schoolOrOffice", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => Employee_1.Employee),
    __metadata("design:type", Array)
], Position.prototype, "employees", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => Position, {
        foreignKey: "parentPositionId",
        as: "parentPosition",
    }),
    __metadata("design:type", Position)
], Position.prototype, "parentPosition", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => Unit_1.Unit, {
        foreignKey: "unitId",
        as: "unit",
    }),
    __metadata("design:type", Unit_1.Unit)
], Position.prototype, "unit", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => Position, {
        foreignKey: "parentPositionId",
        as: "childPositions",
    }),
    __metadata("design:type", Array)
], Position.prototype, "childPositions", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => EmployeePosition_1.EmployeePosition),
    __metadata("design:type", Array)
], Position.prototype, "employeePositions", void 0);
exports.Position = Position = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: "positions",
        timestamps: true,
        underscored: true,
    })
], Position);
//# sourceMappingURL=Position.js.map