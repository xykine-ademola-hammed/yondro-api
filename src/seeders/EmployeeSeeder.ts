import { faker } from "@faker-js/faker";
import { Employee } from "../models/Employee";
import { Position } from "../models/Position";
import { Department } from "../models/Department";
import * as bcrypt from "bcryptjs";

export class EmployeeSeeder {
  static async run(): Promise<void> {
    const positions = await Position.findAll({
      include: [{ model: Department, as: "department" }],
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
        departmentId: position.departmentId,
        positionId: position.id,
        firstName,
        lastName,
        email,
        phone: faker.phone.number(),
        password: await bcrypt.hash("password", 12), // Will be hashed by the model hook
        role: "Admin",
        isActive: faker.datatype.boolean(0.95),
      });
    }

    await Employee.bulkCreate(employees, { ignoreDuplicates: true });
  }
}
