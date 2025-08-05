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
} from "sequelize-typescript";
import { Organization } from "./Organization";
import { Department } from "./Department";
import { Position } from "./Position";
import { WorkflowRequest } from "./WorkflowRequest";
import { WorkflowInstanceStage } from "./WorkflowInstanceStage";
import * as bcrypt from "bcryptjs";

@Table({
  tableName: "employees",
  timestamps: true,
  underscored: true,
})
export class Employee extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id!: number;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  organizationId!: number;

  @ForeignKey(() => Department)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  departmentId!: number;

  @ForeignKey(() => Position)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  positionId!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  firstName!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  lastName!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  })
  email!: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  phone?: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  password!: string;

  @Column({
    type: DataType.ENUM("Admin", "Manager", "Employee"),
    defaultValue: "Employee",
  })
  role!: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  isActive!: boolean;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Virtual field
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Associations
  @BelongsTo(() => Organization)
  organization!: Organization;

  @BelongsTo(() => Department)
  department!: Department;

  @BelongsTo(() => Position)
  position!: Position;

  @HasMany(() => WorkflowRequest, "requestorId")
  requests!: WorkflowRequest[];

  @HasMany(() => WorkflowInstanceStage, "assignedToUserId")
  assignedStages!: WorkflowInstanceStage[];

  @HasMany(() => WorkflowInstanceStage, "actedByUserId")
  actedStages!: WorkflowInstanceStage[];

  // Hooks
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

export interface EmployeeAttributes {
  id: number;
  organizationId: number;
  departmentId: number;
  positionId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  isActive: boolean;
  password: string;
  role: string;
  createdAt?: Date;
  updatedAt?: Date;
}
