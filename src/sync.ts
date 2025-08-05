import sequelize from "./config/database"; // Assuming you have a sequelize instance

const syncDatabase = async () => {
  try {
    // Authenticate the connection
    await sequelize.authenticate();
    console.log("Database connection established successfully.");

    // Synchronize models
    await sequelize.sync({ force: false, alter: true }); // Use force: true for development, alter: true or migrations for production
    console.log("All models synchronized successfully.");
  } catch (error) {
    console.error("Error synchronizing database:", error);
  } finally {
    await sequelize.close(); // Close the connection after synchronization
    console.log("Database connection closed.");
  }
};

syncDatabase();
