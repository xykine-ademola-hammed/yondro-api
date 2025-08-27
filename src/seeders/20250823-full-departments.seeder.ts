import { faker } from "@faker-js/faker";
import { Department } from "../models/Department";
import { SchoolOrOffice } from "../models";
import { schoolOfficeDepartentUnits } from "./20250823-full-schoolOrOffices.seeder";

export class FullDepartmentSeeder {
  static async run(): Promise<void> {
    const schoolsOrOffices = await SchoolOrOffice.findAll();

    if (schoolsOrOffices.length === 0) {
      throw new Error(
        "No organizations found. Please seed organizations first."
      );
    }

    interface DepartmentData {
      name: string;
      financeCode: string;
      schoolOrOfficeId: number;
      organizationId: number;
    }

    let departments: DepartmentData[] = [];

    for (let schoolOrOffice of schoolsOrOffices) {
      const schoolDepartments = schoolOfficeDepartentUnits.find(
        (data) => data.name === schoolOrOffice.name
      );
      const departmentData = schoolDepartments?.departments?.map((dept) => ({
        name: dept.name,
        financeCode: "financeCode" in dept ? dept.financeCode : "",
        schoolOrOfficeId: schoolOrOffice.id,
        organizationId: schoolOrOffice.organizationId,
      }));
      if (departmentData?.length && departmentData?.length > 0)
        departments = [...departments, ...departmentData];
    }

    await Department.bulkCreate(departments as any[], {
      ignoreDuplicates: true,
    });
  }
}
