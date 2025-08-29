"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_typescript_1 = require("sequelize-typescript");
const models_1 = require("../models");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASS:", process.env.DB_PASSWORD);
console.log("DB_NAME:", process.env.DB_NAME);
const sequelize = new sequelize_typescript_1.Sequelize({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "3306"),
    database: process.env.DB_NAME,
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    dialect: process.env.NODE_ENV === "development" ? "mysql" : "mysql",
    storage: process.env.NODE_ENV === "development" ? ":memory:" : undefined,
    logging: process.env.NODE_ENV === "development" ? console.log : false,
    models: [
        models_1.Organization,
        models_1.Department,
        models_1.Position,
        models_1.Employee,
        models_1.Workflow,
        models_1.Stage,
        models_1.WorkflowRequest,
        models_1.WorkflowInstanceStage,
        models_1.EmployeePosition,
        models_1.SchoolOrOffice,
        models_1.Unit,
        models_1.SubUnit,
    ],
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000,
    },
});
exports.default = sequelize;
//# sourceMappingURL=database.js.map