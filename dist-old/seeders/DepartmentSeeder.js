"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DepartmentSeeder = void 0;
const faker_1 = require("@faker-js/faker");
const Department_1 = require("../models/Department");
const Organization_1 = require("../models/Organization");
class DepartmentSeeder {
    static async run() {
        const organizations = await Organization_1.Organization.findAll();
        if (organizations.length === 0) {
            throw new Error("No organizations found. Please seed organizations first.");
        }
        const departmentTemplates = [
            {
                name: "Finance",
                description: "Handles financial planning and accounting",
            },
            {
                name: "Information Technology",
                description: "Manages technology infrastructure",
            },
            { name: "Audit", description: "Promotes products and services" },
            {
                name: "Procurement",
                description: "Supports customer needs and inquiries",
            },
            {
                name: "Bursary",
                description: "Ensures product and service accounted for",
            },
            {
                name: "Executive",
                description: "Ensures product and service accounted for",
            },
            {
                name: "Human Resources",
                description: "Manages employee relations and policies",
            },
        ];
        const departments = [];
        for (const org of organizations) {
            for (const template of departmentTemplates) {
                departments.push({
                    organizationId: org.id,
                    name: template.name,
                    description: template.description,
                    isActive: faker_1.faker.datatype.boolean(0.95),
                });
            }
        }
        await Department_1.Department.bulkCreate(departments, { ignoreDuplicates: true });
    }
}
exports.DepartmentSeeder = DepartmentSeeder;
//# sourceMappingURL=DepartmentSeeder.js.map