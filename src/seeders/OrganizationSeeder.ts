import { Organization } from "../models/Organization";

export class OrganizationSeeder {
  static async run(): Promise<void> {
    const organizations = [
      {
        name: "Federal College of Education (Special), Oyo",
        description: "Special College of Education, Oyo",
        isActive: true,
      },
    ];
    await Organization.bulkCreate(organizations, { ignoreDuplicates: true });
  }
}
