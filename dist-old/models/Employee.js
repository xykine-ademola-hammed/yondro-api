"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Employee = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const bcrypt = __importStar(require("bcryptjs"));
const Organization_1 = require("./Organization");
const Department_1 = require("./Department");
const Position_1 = require("./Position");
const WorkflowRequest_1 = require("./WorkflowRequest");
const WorkflowInstanceStage_1 = require("./WorkflowInstanceStage");
const EmployeePosition_1 = require("./EmployeePosition");
const SchoolOrOffice_1 = require("./SchoolOrOffice");
const Unit_1 = require("./Unit");
let Employee = class Employee extends sequelize_typescript_1.Model {
    get fullName() {
        return `${this.getDataValue("firstName")} ${this.getDataValue("lastName")}`;
    }
    static async hashPasswordBeforeCreate(instance) {
        if (instance.password) {
            instance.password = await bcrypt.hash(instance.password, 12);
        }
    }
    static async hashPasswordBeforeUpdate(instance) {
        if (instance.changed("password")) {
            instance.password = await bcrypt.hash(instance.password, 12);
        }
    }
};
exports.Employee = Employee;
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER, autoIncrement: true, primaryKey: true }),
    __metadata("design:type", Number)
], Employee.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(100), allowNull: false, field: "first_name" }),
    __metadata("design:type", String)
], Employee.prototype, "firstName", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(100), allowNull: false, field: "last_name" }),
    __metadata("design:type", String)
], Employee.prototype, "lastName", void 0);
__decorate([
    (0, sequelize_typescript_1.Index)({ name: "uq_employees_email", unique: true }),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
        field: "email",
    }),
    __metadata("design:type", String)
], Employee.prototype, "email", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(20), allowNull: true, field: "phone" }),
    __metadata("design:type", Object)
], Employee.prototype, "phone", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.STRING(255), allowNull: false, field: "password" }),
    __metadata("design:type", String)
], Employee.prototype, "password", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ENUM("Admin", "Manager", "Employee"),
        defaultValue: "Employee",
        field: "role",
    }),
    __metadata("design:type", String)
], Employee.prototype, "role", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.BOOLEAN, defaultValue: true, field: "is_active" }),
    __metadata("design:type", Boolean)
], Employee.prototype, "isActive", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Organization_1.Organization),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        field: "organization_id",
    }),
    __metadata("design:type", Number)
], Employee.prototype, "organizationId", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => SchoolOrOffice_1.SchoolOrOffice),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        field: "school_or_office_id",
    }),
    __metadata("design:type", Number)
], Employee.prototype, "schoolOrOfficeId", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Position_1.Position),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER, allowNull: false, field: "position_id" }),
    __metadata("design:type", Number)
], Employee.prototype, "positionId", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Department_1.Department),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER, allowNull: true, field: "department_id" }),
    __metadata("design:type", Object)
], Employee.prototype, "departmentId", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Unit_1.Unit),
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.INTEGER, allowNull: true, field: "unit_id" }),
    __metadata("design:type", Object)
], Employee.prototype, "unitId", void 0);
__decorate([
    sequelize_typescript_1.CreatedAt,
    (0, sequelize_typescript_1.Column)({ field: "created_at" }),
    __metadata("design:type", Date)
], Employee.prototype, "createdAt", void 0);
__decorate([
    sequelize_typescript_1.UpdatedAt,
    (0, sequelize_typescript_1.Column)({ field: "updated_at" }),
    __metadata("design:type", Date)
], Employee.prototype, "updatedAt", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({ type: sequelize_typescript_1.DataType.TEXT, allowNull: true, field: "photo_url" }),
    __metadata("design:type", Object)
], Employee.prototype, "photoUrl", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.VIRTUAL),
    __metadata("design:type", String),
    __metadata("design:paramtypes", [])
], Employee.prototype, "fullName", null);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => Organization_1.Organization, {
        foreignKey: "organizationId",
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
    }),
    __metadata("design:type", Organization_1.Organization)
], Employee.prototype, "organization", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => SchoolOrOffice_1.SchoolOrOffice, {
        foreignKey: "schoolOrOfficeId",
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
    }),
    __metadata("design:type", SchoolOrOffice_1.SchoolOrOffice)
], Employee.prototype, "schoolOrOffice", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => Position_1.Position, {
        foreignKey: "positionId",
        onDelete: "RESTRICT",
        onUpdate: "CASCADE",
    }),
    __metadata("design:type", Position_1.Position)
], Employee.prototype, "position", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => Department_1.Department, {
        foreignKey: "departmentId",
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
    }),
    __metadata("design:type", Department_1.Department)
], Employee.prototype, "department", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => Unit_1.Unit, {
        foreignKey: "unitId",
        onDelete: "SET NULL",
        onUpdate: "CASCADE",
    }),
    __metadata("design:type", Unit_1.Unit)
], Employee.prototype, "unit", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => EmployeePosition_1.EmployeePosition),
    __metadata("design:type", Array)
], Employee.prototype, "employeePositions", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => WorkflowRequest_1.WorkflowRequest, "requestorId"),
    __metadata("design:type", Array)
], Employee.prototype, "requests", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => WorkflowInstanceStage_1.WorkflowInstanceStage, "assignedToUserId"),
    __metadata("design:type", Array)
], Employee.prototype, "assignedStages", void 0);
__decorate([
    (0, sequelize_typescript_1.HasMany)(() => WorkflowInstanceStage_1.WorkflowInstanceStage, "actedByUserId"),
    __metadata("design:type", Array)
], Employee.prototype, "actedStages", void 0);
__decorate([
    sequelize_typescript_1.BeforeCreate,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Employee]),
    __metadata("design:returntype", Promise)
], Employee, "hashPasswordBeforeCreate", null);
__decorate([
    sequelize_typescript_1.BeforeUpdate,
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Employee]),
    __metadata("design:returntype", Promise)
], Employee, "hashPasswordBeforeUpdate", null);
exports.Employee = Employee = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: "employees",
        timestamps: true,
        underscored: true,
    })
], Employee);
//# sourceMappingURL=Employee.js.map