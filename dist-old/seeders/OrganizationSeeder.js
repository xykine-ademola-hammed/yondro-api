"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrganizationSeeder = void 0;
const Organization_1 = require("../models/Organization");
class OrganizationSeeder {
    static async run() {
        const organizations = [
            {
                name: "Federal College of Education (Special), Oyo",
                description: "Special College of Education, Oyo",
                isActive: true,
            },
        ];
        await Organization_1.Organization.bulkCreate(organizations, { ignoreDuplicates: true });
    }
}
exports.OrganizationSeeder = OrganizationSeeder;
//# sourceMappingURL=OrganizationSeeder.js.map