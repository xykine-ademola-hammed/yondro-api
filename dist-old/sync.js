"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./config/database"));
const syncDatabase = async () => {
    try {
        await database_1.default.authenticate();
        console.log("Database connection established successfully.");
        await database_1.default.sync({ force: false, alter: true });
        console.log("All models synchronized successfully.");
    }
    catch (error) {
        console.error("Error synchronizing database:", error);
    }
    finally {
        await database_1.default.close();
        console.log("Database connection closed.");
    }
};
syncDatabase();
//# sourceMappingURL=sync.js.map