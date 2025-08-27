#!/usr/bin/env ts-node

import "reflect-metadata";
import dotenv from "dotenv";
import sequelize from "../config/database";
import { DatabaseSeeder } from "../seeders";

// Load environment variables
dotenv.config();

async function runSeeder() {
  try {
    console.log("🔌 Connecting to database...");
    await sequelize.authenticate();
    console.log("✅ Database connection established");

    // Sync database (create tables)
    console.log("🔄 Syncing database...");
    await sequelize.sync({ force: false });
    console.log("✅ Database synced");

    // Run seeders
    const seeder = new DatabaseSeeder(sequelize);

    // Check if we should clear first
    const shouldClear = process.argv.includes("--clear");
    if (shouldClear) {
      await seeder.clear();
    }

    await seeder.run();

    console.log("🎉 Seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

// Handle command line arguments
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
