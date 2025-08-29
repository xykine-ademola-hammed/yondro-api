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
exports.SchoolOrOffice = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const Organization_1 = require("./Organization");
const Position_1 = require("./Position");
const Employee_1 = require("./Employee");
const Department_1 = require("./Department");
let SchoolOrOffice = class SchoolOrOffice extends sequelize_typescript_1.Model {
};
exports.SchoolOrOffice = SchoolOrOffice;
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER, autoIncrement: true, primaryKey: true }),
    __metadata("design:type", Number)
], SchoolOrOffice.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Organization_1.Organization),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], SchoolOrOffice.prototype, "organizationId", void 0);
__decorate([
    (0, sequelize_typescript_1.Index)({ name: "uq_soo_org_name", unique: true }),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(255), allowNull: false, field: "name" }),
    __metadata("design:type", String)
], SchoolOrOffice.prototype, "name", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.TEXT, allowNull: true, field: "description" }),
    __metadata("design:type", Object)
], SchoolOrOffice.prototype, "description", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
        allowNull: true,
        field: "finance_code",
    }),
    __metadata("design:type", Object)
], SchoolOrOffice.prototype, "financeCode", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.BOOLEAN, defaultValue: true, field: "is_active" }),
    __metadata("design:type", Boolean)
], SchoolOrOffice.prototype, "isActive", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    (0, sequelize_typescript_1.Column)({ field: "created_at" }),
    __metadata("design:type", Date)
], SchoolOrOffice.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    (0, sequelize_typescript_1.Column)({ field: "updated_at" }),
    __metadata("design:type", Date)
], SchoolOrOffice.prototype, "updatedAt", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => Organization_1.Organization, {
        foreignKey: "organizationId",
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
    }),
    __metadata("design:type", Organization_1.Organization)
], SchoolOrOffice.prototype, "organization", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => Department_1.Department),
    __metadata("design:type", Array)
], SchoolOrOffice.prototype, "departments", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => Position_1.Position),
    __metadata("design:type", Array)
], SchoolOrOffice.prototype, "positions", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => Employee_1.Employee),
    __metadata("design:type", Array)
], SchoolOrOffice.prototype, "employees", void 0);
exports.SchoolOrOffice = SchoolOrOffice = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: "school_or_offices",
        timestamps: true,
        underscored: true,
    })
], SchoolOrOffice);
//# sourceMappingURL=SchoolOrOffice.js.map