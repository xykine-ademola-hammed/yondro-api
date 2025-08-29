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
exports.Department = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const Organization_1 = require("./Organization");
const Position_1 = require("./Position");
const Employee_1 = require("./Employee");
const Stage_1 = require("./Stage");
const SchoolOrOffice_1 = require("./SchoolOrOffice");
const Unit_1 = require("./Unit");
let Department = class Department extends sequelize_typescript_1.Model {
};
exports.Department = Department;
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    }),
    __metadata("design:type", Number)
], Department.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Organization_1.Organization),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], Department.prototype, "organizationId", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => SchoolOrOffice_1.SchoolOrOffice),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], Department.prototype, "schoolOrOfficeId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
        allowNull: false,
    }),
    __metadata("design:type", String)
], Department.prototype, "name", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.TEXT,
        allowNull: true,
    }),
    __metadata("design:type", String)
], Department.prototype, "description", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
        allowNull: true,
    }),
    __metadata("design:type", String)
], Department.prototype, "financeCode", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        defaultValue: true,
    }),
    __metadata("design:type", Boolean)
], Department.prototype, "isActive", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    __metadata("design:type", Date)
], Department.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    __metadata("design:type", Date)
], Department.prototype, "updatedAt", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => Organization_1.Organization),
    __metadata("design:type", Organization_1.Organization)
], Department.prototype, "organization", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => SchoolOrOffice_1.SchoolOrOffice),
    __metadata("design:type", SchoolOrOffice_1.SchoolOrOffice)
], Department.prototype, "schoolOrOffice", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => Position_1.Position),
    __metadata("design:type", Array)
], Department.prototype, "positions", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => Unit_1.Unit),
    __metadata("design:type", Array)
], Department.prototype, "units", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => Employee_1.Employee),
    __metadata("design:type", Array)
], Department.prototype, "employees", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => Stage_1.Stage),
    __metadata("design:type", Array)
], Department.prototype, "stages", void 0);
exports.Department = Department = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: "departments",
        timestamps: true,
        underscored: true,
    })
], Department);
//# sourceMappingURL=Department.js.map