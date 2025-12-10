import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  BeforeCreate,
  BeforeUpdate,
  ForeignKey,
  BelongsTo,
  HasMany,
  Index,
} from "sequelize-typescript";
import * as bcrypt from "bcryptjs";
import { Organization } from "./Organization";
import { Department } from "./Department";
import { Position } from "./Position";
import { WorkflowRequest } from "./WorkflowRequest";
import { WorkflowInstanceStage } from "./WorkflowInstanceStage";
import { EmployeePosition } from "./EmployeePosition";
import { SchoolOrOffice } from "./SchoolOrOffice";
import { Unit } from "./Unit";
import PasswordReset from "./PasswordReset";
import AuditEvent from "./AuditEvent";

type Role = "Admin" | "Manager" | "Employee";

@Table({
  tableName: "employees",
  timestamps: true,
  underscored: true,
  // paranoid: true, // <- enable if you want soft-deletes
})
export class Employee extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id!: number;

  @Column({ type: DataType.STRING(100), allowNull: false, field: "first_name" })
  firstName!: string;

  @Column({ type: DataType.STRING(100), allowNull: false, field: "last_name" })
  lastName!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    validate: { isEmail: true },
    field: "email",
  })
  email!: string;

  @Column({ type: DataType.STRING(20), allowNull: true, field: "phone" })
  phone?: string | null;

  @Column({ type: DataType.STRING(255), allowNull: false, field: "password" })
  password!: string;

  @Column({
    type: DataType.ENUM("Admin", "Manager", "Employee"),
    defaultValue: "Employee",
    field: "role",
  })
  role!: Role;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  get permissions(): string[] {
    const raw = this.getDataValue("permissions") as unknown;
    if (Array.isArray(raw)) return raw;
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }
  set permissions(val: unknown) {
    if (Array.isArray(val)) {
      this.setDataValue("permissions", val);
      return;
    }
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        this.setDataValue(
          "permissions",
          Array.isArray(parsed) ? parsed : [val]
        );
      } catch {
        this.setDataValue("permissions", [val]);
      }
      return;
    }
    this.setDataValue("permissions", []);
  }

  @Column({ type: DataType.BOOLEAN, defaultValue: true, field: "is_active" })
  isActive!: boolean;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "organization_id",
  })
  organizationId!: number;

  @ForeignKey(() => SchoolOrOffice)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: "school_or_office_id",
  })
  schoolOrOfficeId?: number | null;

  @ForeignKey(() => Position)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: "position_id",
  })
  positionId?: number | null;

  @ForeignKey(() => Department)
  @Column({ type: DataType.INTEGER, allowNull: true, field: "department_id" })
  departmentId?: number | null;

  @ForeignKey(() => Unit)
  @Column({ type: DataType.INTEGER, allowNull: true, field: "unit_id" })
  unitId?: number | null;

  // @Index
  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  lastPasswordResetAt?: Date;

  @HasMany(() => PasswordReset, "userId")
  passwordResets!: PasswordReset[];

  @HasMany(() => AuditEvent, "userId")
  auditEvents!: AuditEvent[];

  @HasMany(() => AuditEvent, "actorId")
  actorEvents!: AuditEvent[];

  @CreatedAt
  @Column({ field: "created_at" })
  createdAt!: Date;

  @UpdatedAt
  @Column({ field: "updated_at" })
  updatedAt!: Date;

  @Column({ type: DataType.TEXT, allowNull: true, field: "photo_url" })
  photoUrl?: string | null;

  @Column(DataType.VIRTUAL)
  get fullName(): string {
    return `${this.getDataValue("firstName")} ${this.getDataValue("lastName")}`;
  }

  // --- Associations & delete policies ---
  @BelongsTo(() => Organization, {
    foreignKey: "organizationId",
    onDelete: "RESTRICT", // or 'CASCADE' if you want employees auto-removed
    onUpdate: "CASCADE",
  })
  organization!: Organization;

  @BelongsTo(() => SchoolOrOffice, {
    foreignKey: "schoolOrOfficeId",
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  schoolOrOffice?: SchoolOrOffice | null;

  @BelongsTo(() => Position, {
    foreignKey: "positionId",
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  position?: Position | null;

  @BelongsTo(() => Department, {
    foreignKey: "departmentId",
    onDelete: "SET NULL", // department optional -> set null when deleted
    onUpdate: "CASCADE",
  })
  department?: Department;

  @BelongsTo(() => Unit, {
    foreignKey: "unitId",
    onDelete: "SET NULL", // unit optional -> set null when deleted
    onUpdate: "CASCADE",
  })
  unit?: Unit;

  @HasMany(() => EmployeePosition)
  employeePositions!: EmployeePosition[];

  @HasMany(() => WorkflowRequest, "requestorId")
  requests!: WorkflowRequest[];

  @HasMany(() => WorkflowInstanceStage, "assignedToUserId")
  assignedStages!: WorkflowInstanceStage[];

  @HasMany(() => WorkflowInstanceStage, "actedByUserId")
  actedStages!: WorkflowInstanceStage[];

  // --- Hooks ---
  @BeforeCreate
  static async hashPasswordBeforeCreate(instance: Employee) {
    if (instance.password) {
      instance.password = await bcrypt.hash(instance.password, 12);
    }
  }

  @BeforeUpdate
  static async hashPasswordBeforeUpdate(instance: Employee) {
    if (instance.changed("password")) {
      instance.password = await bcrypt.hash(instance.password, 12);
    }
  }
}

// Narrow, accurate attribute interface for external typing
export interface EmployeeAttributes {
  id: number;
  organizationId: number;
  schoolOrOfficeId?: number | null;
  positionId?: number | null;
  departmentId?: number | null;
  unitId?: number | null;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  isActive: boolean;
  password: string;
  role: Role;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface EmployeeCreationAttributes
  extends Omit<EmployeeAttributes, "id" | "createdAt" | "updatedAt"> {}
