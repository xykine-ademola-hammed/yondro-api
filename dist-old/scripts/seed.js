#!/usr/bin/env ts-node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = __importDefault(require("../config/database"));
const seeders_1 = require("../seeders");
dotenv_1.default.config();
async function runSeeder() {
    try {
        console.log("🔌 Connecting to database...");
        await database_1.default.authenticate();
        console.log("✅ Database connection established");
        console.log("🔄 Syncing database...");
        await database_1.default.sync({ force: false });
        console.log("✅ Database synced");
        const seeder = new seeders_1.DatabaseSeeder(database_1.default);
        const shouldClear = process.argv.includes("--clear");
        if (shouldClear) {
            await seeder.clear();
        }
        await seeder.run();
        console.log("🎉 Seeding completed successfully!");
        process.exit(0);
    }
    catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
}
if (process.argv.includes("--help")) {
    console.log(`
Database Seeder

Usage:
  npm run seed              # Run seeders
  npm run seed -- --clear   # Clear database and run seeders

Options:
  --clear    Clear all data before seeding
  --help     Show this help message
  `);
    process.exit(0);
}
runSeeder();
//# sourceMappingURL=seed.js.map