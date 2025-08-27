import { faker } from "@faker-js/faker";
import { Department } from "../models/Department";
import { Organization } from "../models/Organization";

export class DepartmentSeeder {
  static async run(): Promise<void> {
    const organizations = await Organization.findAll();

    if (organizations.length === 0) {
      throw new Error(
        "No organizations found. Please seed organizations first."
      );
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
      //   {
      //     name: "Sales",
      //     description: "Drives revenue through customer acquisition",
      //   },
      //   {
      //     name: "Works",
      //     description: "Ensures product and service quality",
      //   },
    ];

    const departments = [];

    // Create departments for each organization
    for (const org of organizations) {
      for (const template of departmentTemplates) {
        departments.push({
          organizationId: org.id,
          name: template.name,
          description: template.description,
          isActive: faker.datatype.boolean(0.95), // 95% chance of being active
        });
      }
    }

    await Department.bulkCreate(departments, { ignoreDuplicates: true });
  }
}
