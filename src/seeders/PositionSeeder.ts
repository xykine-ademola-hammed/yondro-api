import { faker } from "@faker-js/faker";
import { Position } from "../models/Position";
import { Department } from "../models/Department";

export class PositionSeeder {
  static async run(): Promise<void> {
    const departments = await Department.findAll();

    if (departments.length === 0) {
      throw new Error("No departments found. Please seed departments first.");
    }

    const positionTemplates = {
      "Human Resources": [
        {
          title: "HR Manager",
          description: "Oversees HR operations and strategy",
        },
        {
          title: "HR Specialist",
          description: "Handles recruitment and employee relations",
        },
        {
          title: "Payroll Administrator",
          description: "Manages payroll processing",
        },
        {
          title: "Training Coordinator",
          description: "Organizes employee training programs",
        },
      ],
      Finance: [
        {
          title: "Finance Manager",
          description: "Manages financial operations",
        },
        {
          title: "Accountant",
          description: "Handles accounting and bookkeeping",
        },
        {
          title: "Financial Analyst",
          description: "Analyzes financial data and trends",
        },
        {
          title: "Budget Analyst",
          description: "Manages budgeting and forecasting",
        },
      ],
      "Information Technology": [
        {
          title: "Secretary",
          description: "Oversees IT infrastructure and strategy",
        },
        {
          title: "Head of department",
          description: "Manages servers and network infrastructure",
        },
      ],
      Executive: [
        {
          title: "Chief Executive",
          description: "Oversees daily business operations",
        },
        {
          title: "Dean Engineering",
          description: "Oversees daily business operations",
        },
        {
          title: "Dean Humanity",
          description: "Oversees daily business operations",
        },
      ],
      Procurement: [
        {
          title: "Operations Manager",
          description: "Oversees daily business operations",
        },
        {
          title: "Project Manager",
          description: "Manages projects and deliverables",
        },
        {
          title: "Business Analyst",
          description: "Analyzes business processes and requirements",
        },
        {
          title: "Operations Coordinator",
          description: "Coordinates operational activities",
        },
      ],
      Bursary: [
        {
          title: "Bursar",
          description: "Leads sales team and strategy",
        },
        {
          title: "Voucher Head",
          description: "Sells products and services to customers",
        },
        {
          title: "Voucher Creator",
          description: "Manages key customer accounts",
        },
        {
          title: "Voucher Reviewer",
          description: "Supports sales operations",
        },
        {
          title: "Voucher Approver",
          description: "Supports sales operations",
        },
      ],
      Audit: [
        {
          title: "Chief Auditor",
          description: "Leads sales team and strategy",
        },
        {
          title: "Audit Head of Unit",
          description: "Sells products and services to customers",
        },
        {
          title: "Audit Creator",
          description: "Manages key customer accounts",
        },
        {
          title: "Audit Reviewer",
          description: "Supports sales operations",
        },
        {
          title: "Audit Approver",
          description: "Supports sales operations",
        },
      ],
    };

    const positions = [];

    for (const dept of departments) {
      const templates =
        positionTemplates[dept.name as keyof typeof positionTemplates];

      for (const template of templates) {
        positions.push({
          organizationId: dept.organizationId,
          departmentId: dept.id,
          title: template.title,
          description: template.description,
          isActive: faker.datatype.boolean(0.95),
        });
      }
    }

    await Position.bulkCreate(positions, { ignoreDuplicates: true });
  }
}
