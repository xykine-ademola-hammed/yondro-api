"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FullUnitSeeder = void 0;
const Department_1 = require("../models/Department");
const models_1 = require("../models");
const _20250823_full_schoolOrOffices_seeder_1 = require("./20250823-full-schoolOrOffices.seeder");
function extractUnitsByDepartment() {
    const result = [];
    for (const office of _20250823_full_schoolOrOffices_seeder_1.schoolOfficeDepartentUnits) {
        if (!office.departments)
            continue;
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
class FullUnitSeeder {
    static async run() {
        const schoolsOrOffices = await models_1.SchoolOrOffice.findAll();
        const departments = await Department_1.Department.findAll();
        if (schoolsOrOffices.length === 0) {
            throw new Error("No organizations found. Please seed organizations first.");
        }
        const units = extractUnitsByDepartment();
        let unitData = [];
        for (let unit of units) {
            const department = departments.find((data) => data.name === unit.departmentName);
            if (department?.id) {
                const data = unit.units.map((x) => ({
                    name: x.name,
                    financeCode: "financeCode" in x ? x.financeCode : "",
                    organizationId: 1,
                    departmentId: department.id,
                }));
                if (data?.length && data?.length > 0)
                    unitData = [...unitData, ...data];
            }
        }
        await models_1.Unit.bulkCreate(unitData, {
            ignoreDuplicates: true,
        });
    }
}
exports.FullUnitSeeder = FullUnitSeeder;
//# sourceMappingURL=20250823-units.seeder.js.map