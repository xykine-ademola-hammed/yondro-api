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
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmployeeSeeder = void 0;
const faker_1 = require("@faker-js/faker");
const Employee_1 = require("../models/Employee");
const Position_1 = require("../models/Position");
const Department_1 = require("../models/Department");
const bcrypt = __importStar(require("bcryptjs"));
class EmployeeSeeder {
    static async run() {
        const positions = await Position_1.Position.findAll({
            include: [{ model: Department_1.Department, as: "department" }],
        });
        if (positions.length === 0) {
            throw new Error("No positions found. Please seed positions first.");
        }
        const employees = [];
        for (const position of positions) {
            const firstName = position.title;
            const lastName = "Test";
            const email = `${position.title
                .toLowerCase()
                .replace(/\s+/g, "")}@gmail.com`;
            employees.push({
                organizationId: position.organizationId,
                schoolOrOfficeId: position.schoolOrOfficeId,
                departmentId: position.departmentId,
                positionId: position.id,
                firstName,
                lastName,
                email,
                phone: faker_1.faker.phone.number(),
                password: await bcrypt.hash("password", 12),
                role: "Admin",
                isActive: true,
            });
        }
        await Employee_1.Employee.bulkCreate(employees, { ignoreDuplicates: true });
    }
}
exports.EmployeeSeeder = EmployeeSeeder;
//# sourceMappingURL=EmployeeSeeder.js.map