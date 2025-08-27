import { faker } from "@faker-js/faker";
import { Department } from "../models/Department";
import { SchoolOrOffice, Unit } from "../models";
import { schoolOfficeDepartentUnits } from "./20250823-full-schoolOrOffices.seeder";

function extractUnitsByDepartment() {
  const result = [];

  for (const office of schoolOfficeDepartentUnits) {
    if (!office.departments) continue;

    for (const department of office.departments) {
      if ("units" in department && Array.isArray(department.units)) {
        result.push({
          departmentName: department.name,
          units: department.units.map((unit) => ({
            name: unit.name,
            financeCode: unit.financeCode,
          })),
        });
      }
    }
  }

  return result;
}

export class FullUnitSeeder {
  static async run(): Promise<void> {
    const schoolsOrOffices = await SchoolOrOffice.findAll();
    const departments = await Department.findAll();

    if (schoolsOrOffices.length === 0) {
      throw new Error(
        "No organizations found. Please seed organizations first."
      );
    }

    interface unitData {
      name: string;
      financeCode: string;
      departmentId: number;
    }

    const units = extractUnitsByDepartment();

    let unitData: unitData[] = [];

    for (let unit of units) {
      const department = departments.find(
        (data) => data.name === unit.departmentName
      );
      if (department?.id) {
        const data = unit.units.map((x: { name: any; financeCode: any }) => ({
          name: x.name,
          financeCode: "financeCode" in x ? x.financeCode : "",
          organizationId: 1,
          departmentId: department.id,
        }));
        if (data?.length && data?.length > 0) unitData = [...unitData, ...data];
      }
    }

    await Unit.bulkCreate(unitData as any[], {
      ignoreDuplicates: true,
    });
  }
}
