import { faker } from "@faker-js/faker";
import { Position } from "../models/Position";
import { Department } from "../models/Department";

export class PositionSeeder {
  static async run(): Promise<void> {
    await Position.bulkCreate(
      [
        {
          organizationId: 1,
          departmentId: 1,
          title: "Yondro Admin",
        },
      ],
      { ignoreDuplicates: true }
    );
  }
}
