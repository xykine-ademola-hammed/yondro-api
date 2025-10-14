import "reflect-metadata";
import { Organization } from "./Organization";
import { Department } from "./Department";
import { Position } from "./Position";
import { Employee } from "./Employee";
import { Workflow } from "./Workflow";
import { Stage } from "./Stage";
import { WorkflowRequest } from "./WorkflowRequest";
import { WorkflowInstanceStage } from "./WorkflowInstanceStage";
import { EmployeePosition } from "./EmployeePosition";
import { SchoolOrOffice } from "./SchoolOrOffice";
import { Unit } from "./Unit";
import { SubUnit } from "./SubUnit";
import PasswordReset from "./PasswordReset";
import AuditEvent from "./AuditEvent";
import { Document } from "./Document";
import FiscalYear from "./FiscalYear";
import VoteBookAccount from "./VoteBookAccount";
import Voucher from "./Voucher";
import VoucherLine from "./VoucherLine";
import BudgetAdjustment from "./BudgetAdjustment";
import ApprovalAction from "./ApprovalAction";
import AuditLog from "./AuditLog";
import Commitment from "./Commitment";
import Payment from "./Payment";
import NcoaCode from "./NcoaCode";

// Export all models
export {
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
};

// Note: Associations are now defined using decorators in the model files
// sequelize-typescript will automatically handle the associations
