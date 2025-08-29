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
exports.EmployeePosition = void 0;
const sequelize_typescript_1 = require("sequelize-typescript");
const Department_1 = require("./Department");
const Position_1 = require("./Position");
const Employee_1 = require("./Employee");
let EmployeePosition = class EmployeePosition extends sequelize_typescript_1.Model {
};
exports.EmployeePosition = EmployeePosition;
__decorate([
    sequelize_typescript_1.PrimaryKey,
    sequelize_typescript_1.AutoIncrement,
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.INTEGER),
    __metadata("design:type", Number)
], EmployeePosition.prototype, "id", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Department_1.Department),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], EmployeePosition.prototype, "departmentId", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Position_1.Position),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], EmployeePosition.prototype, "positionId", void 0);
__decorate([
    (0, sequelize_typescript_1.ForeignKey)(() => Employee_1.Employee),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
    }),
    __metadata("design:type", Number)
], EmployeePosition.prototype, "employeeId", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        allowNull: false,
    }),
    __metadata("design:type", Date)
], EmployeePosition.prototype, "startDate", void 0);
__decorate([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        allowNull: true,
    }),
    __metadata("design:type", Date)
], EmployeePosition.prototype, "endDate", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => Department_1.Department),
    __metadata("design:type", Department_1.Department)
], EmployeePosition.prototype, "department", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => Position_1.Position),
    __metadata("design:type", Position_1.Position)
], EmployeePosition.prototype, "position", void 0);
__decorate([
    (0, sequelize_typescript_1.BelongsTo)(() => Employee_1.Employee),
    __metadata("design:type", Employee_1.Employee)
], EmployeePosition.prototype, "employee", void 0);
exports.EmployeePosition = EmployeePosition = __decorate([
    (0, sequelize_typescript_1.Table)({
        tableName: "employee_positions",
        timestamps: true,
    })
], EmployeePosition);
//# sourceMappingURL=EmployeePosition.js.map