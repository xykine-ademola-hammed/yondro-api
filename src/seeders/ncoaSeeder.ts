import fs from "fs";
import path from "path";
import NcoaCode from "../models/NcoaCode";

export const seedNcoaCodes = async () => {
  try {
    console.log("Starting NCOA codes seeding...");

    // Read the TSV file
    const filePath = path.join(__dirname, "../NCOA.tsv");
    const fileContent = fs.readFileSync(filePath, "utf-8");

    // Split into lines and remove header
    const lines = fileContent.split("\n").slice(1); // Skip header row

    const ncoaCodes = [];

    for (const line of lines) {
      if (!line.trim()) continue; // Skip empty lines

      // Split by tab character
      const columns = line.split("\t");

      // Skip if not enough columns or if code is empty
      if (columns.length < 8 || !columns[0] || columns[0].trim() === "")
        continue;

      const [
        code,
        economicType,
        fgTitle,
        stateTitle,
        lgTitle,
        accountType,
        level,
        type,
      ] = columns;

      // Clean and validate data
      const cleanCode = code.trim();
      const cleanEconomicType = economicType?.trim() || "";
      const cleanFgTitle = fgTitle?.trim() || "";
      const cleanStateTitle = stateTitle?.trim() || "N/A";
      const cleanLgTitle = lgTitle?.trim() || "N/A";
      const cleanAccountType = accountType?.trim() || "";
      const cleanLevel = parseInt(level?.trim()) || 0;
      const cleanType = type?.trim() || "";

      // Skip if essential fields are missing
      if (!cleanCode || !cleanEconomicType || cleanLevel === 0) continue;

      ncoaCodes.push({
        code: cleanCode,
        economic_type: cleanEconomicType,
        fg_title: cleanFgTitle,
        state_title: cleanStateTitle,
        lg_title: cleanLgTitle,
        account_type: cleanAccountType,
        level: cleanLevel,
        type: cleanType,
        is_active: true,
      });
    }

    console.log(`Parsed ${ncoaCodes.length} NCOA codes from file`);

    // Clear existing data
    await NcoaCode.destroy({ where: {} });
    console.log("Cleared existing NCOA codes");

    // Bulk insert new data
    await NcoaCode.bulkCreate(ncoaCodes, {
      ignoreDuplicates: true,
      validate: true,
    });

    console.log(`Successfully seeded ${ncoaCodes.length} NCOA codes`);

    // Log summary by type
    const summary = await NcoaCode.findAll({
      attributes: [
        "economic_type",
        [
          NcoaCode.sequelize!.fn("COUNT", NcoaCode.sequelize!.col("id")),
          "count",
        ],
      ],
      group: ["economic_type"],
      raw: true,
    });

    console.log("\nSummary by Economic Type:");
    summary.forEach((item: any) => {
      console.log(`- ${item.economic_type}: ${item.count} codes`);
    });

    // Log summary by level
    const levelSummary = await NcoaCode.findAll({
      attributes: [
        "level",
        [
          NcoaCode.sequelize!.fn("COUNT", NcoaCode.sequelize!.col("id")),
          "count",
        ],
      ],
      group: ["level"],
      order: [["level", "ASC"]],
      raw: true,
    });

    console.log("\nSummary by Level:");
    levelSummary.forEach((item: any) => {
      console.log(`- Level ${item.level}: ${item.count} codes`);
    });
  } catch (error) {
    console.error("Error seeding NCOA codes:", error);
    throw error;
  }
};

// Run seeder if called directly
if (require.main === module) {
  seedNcoaCodes()
    .then(() => {
      console.log("NCOA codes seeding completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("NCOA codes seeding failed:", error);
      process.exit(1);
    });
}
