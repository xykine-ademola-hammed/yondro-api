import { Sequelize } from "sequelize-typescript";
import { OrganizationSeeder } from "./OrganizationSeeder";
import { DepartmentSeeder } from "./DepartmentSeeder";
import { PositionSeeder } from "./PositionSeeder";
import { EmployeeSeeder } from "./EmployeeSeeder";
import { SchoolOrOfficeSeeder } from "./20250823-full-schoolOrOffices.seeder";
import { FullDepartmentSeeder } from "./20250823-full-departments.seeder";
import { FullUnitSeeder } from "./20250823-units.seeder";
import { seedNcoaCodes } from "./ncoaSeeder";

export class DatabaseSeeder {
  private sequelize: Sequelize;

  constructor(sequelize: Sequelize) {
    this.sequelize = sequelize;
  }

  async run(): Promise<void> {
    console.log("🌱 Starting database seeding...");

    try {
      // Run seeders in order (respecting foreign key dependencies)
      // await OrganizationSeeder.run();
      console.log("✅ Organizations seeded");

      // await SchoolOrOfficeSeeder.run();
      console.log("✅ SchoolOrOfficeSeeder seeded");

      // await FullDepartmentSeeder.run();
      console.log("✅ FullDepartmentSeeder seeded");

      // await FullUnitSeeder.run();

      // await PositionSeeder.run();
      console.log("✅ Positions seeded");

      // await EmployeeSeeder.run();
      console.log("✅ Employees seeded");

      console.log("✅ NCOA CODES seeded");
      await seedNcoaCodes();

      console.log("🎉 Database seeding completed successfully!");
    } catch (error) {
      console.error("❌ Database seeding failed:", error);
      throw error;
    }
  }

  async clear(): Promise<void> {
    console.log("🧹 Clearing database...");

    try {
      // Clear in reverse order to respect foreign key constraints
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
    } catch (error) {
      console.error("❌ Database clearing failed:", error);
      throw error;
    }
  }
}
