"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseSeeder = void 0;
const EmployeeSeeder_1 = require("./EmployeeSeeder");
class DatabaseSeeder {
    constructor(sequelize) {
        this.sequelize = sequelize;
    }
    async run() {
        console.log("🌱 Starting database seeding...");
        try {
            console.log("✅ Organizations seeded");
            console.log("✅ SchoolOrOfficeSeeder seeded");
            console.log("✅ FullDepartmentSeeder seeded");
            console.log("✅ Positions seeded");
            await EmployeeSeeder_1.EmployeeSeeder.run();
            console.log("✅ Employees seeded");
            console.log("🎉 Database seeding completed successfully!");
        }
        catch (error) {
            console.error("❌ Database seeding failed:", error);
            throw error;
        }
    }
    async clear() {
        console.log("🧹 Clearing database...");
        try {
            await this.sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
            await this.sequelize.models.WorkflowInstanceStage.destroy({
                where: {},
                force: true,
            });
            await this.sequelize.models.WorkflowRequest.destroy({
                where: {},
                force: true,
            });
            await this.sequelize.models.Stage.destroy({ where: {}, force: true });
            await this.sequelize.models.Workflow.destroy({ where: {}, force: true });
            await this.sequelize.models.Employee.destroy({ where: {}, force: true });
            await this.sequelize.models.Position.destroy({ where: {}, force: true });
            await this.sequelize.models.Unit.destroy({
                where: {},
                force: true,
            });
            await this.sequelize.models.Department.destroy({
                where: {},
                force: true,
            });
            await this.sequelize.models.SchoolOrOffice.destroy({
                where: {},
                force: true,
            });
            await this.sequelize.models.Organization.destroy({
                where: {},
                force: true,
            });
            await this.sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
            console.log("✅ Database cleared successfully!");
        }
        catch (error) {
            console.error("❌ Database clearing failed:", error);
            throw error;
        }
    }
}
exports.DatabaseSeeder = DatabaseSeeder;
//# sourceMappingURL=index.js.map