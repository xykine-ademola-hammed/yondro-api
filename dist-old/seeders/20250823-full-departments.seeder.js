"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FullDepartmentSeeder = void 0;
const Department_1 = require("../models/Department");
const models_1 = require("../models");
const _20250823_full_schoolOrOffices_seeder_1 = require("./20250823-full-schoolOrOffices.seeder");
class FullDepartmentSeeder {
    static async run() {
        const schoolsOrOffices = await models_1.SchoolOrOffice.findAll();
        if (schoolsOrOffices.length === 0) {
            throw new Error("No organizations found. Please seed organizations first.");
        }
        let departments = [];
        for (let schoolOrOffice of schoolsOrOffices) {
            const schoolDepartments = _20250823_full_schoolOrOffices_seeder_1.schoolOfficeDepartentUnits.find((data) => data.name === schoolOrOffice.name);
            const departmentData = schoolDepartments?.departments?.map((dept) => ({
                name: dept.name,
                financeCode: "financeCode" in dept ? dept.financeCode : "",
                schoolOrOfficeId: schoolOrOffice.id,
                organizationId: schoolOrOffice.organizationId,
            }));
            if (departmentData?.length && departmentData?.length > 0)
                departments = [...departments, ...departmentData];
        }
        await Department_1.Department.bulkCreate(departments, {
            ignoreDuplicates: true,
        });
    }
}
exports.FullDepartmentSeeder = FullDepartmentSeeder;
//# sourceMappingURL=20250823-full-departments.seeder.js.map