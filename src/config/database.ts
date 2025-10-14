import { Sequelize } from "sequelize-typescript";
import {
  Organization,
  Department,
  Position,
  Employee,
  Workflow,
  Stage,
  WorkflowRequest,
  WorkflowInstanceStage,
  EmployeePosition,
  SchoolOrOffice,
  Unit,
  SubUnit,
  PasswordReset,
  AuditEvent,
  Document,
  FiscalYear,
  VoteBookAccount,
  Voucher,
  VoucherLine,
  BudgetAdjustment,
  ApprovalAction,
  AuditLog,
  Commitment,
  Payment,
  NcoaCode,
} from "../models";
import dotenv from "dotenv";

dotenv.config();

console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_USER:", process.env.DB_USER);
console.log("DB_PASS:", process.env.DB_PASSWORD);
console.log("DB_NAME:", process.env.DB_NAME);

const sequelize = new Sequelize({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  database: process.env.DB_NAME,
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  dialect: process.env.NODE_ENV === "development" ? "mysql" : "mysql",
  storage: process.env.NODE_ENV === "development" ? ":memory:" : undefined,
  logging: process.env.NODE_ENV === "development" ? console.log : false,
  models: [
    Organization,
    Department,
    Position,
    Employee,
    Workflow,
    Stage,
    WorkflowRequest,
    WorkflowInstanceStage,
    EmployeePosition,
    SchoolOrOffice,
    Unit,
    SubUnit,
    PasswordReset,
    AuditEvent,
    Document,
    FiscalYear,
    VoteBookAccount,
    Voucher,
    VoucherLine,
    BudgetAdjustment,
    ApprovalAction,
    AuditLog,
    Commitment,
    Payment,
    NcoaCode,
  ],
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

export default sequelize;
