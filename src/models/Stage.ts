import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { Organization } from "./Organization";
import { Workflow } from "./Workflow";
import { Department } from "./Department";
import { WorkflowInstanceStage } from "./WorkflowInstanceStage";

@Table({
  tableName: "stages",
  timestamps: true,
  underscored: true,
})
export class Stage extends Model {
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

  @ForeignKey(() => Workflow)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  workflowId!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  step!: number;

  @Column(DataType.BOOLEAN)
  assignToRequestor!: boolean;

  @Column(DataType.BOOLEAN)
  assignToRequestorDepartment!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  requiresInternalLoop!: boolean;

  @ForeignKey(() => Department)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  departmentId?: number;

  @Column({
    type: DataType.JSON,
    defaultValue: {},
  })
  fields!: Record<string, any>;

  @Column({
    type: DataType.JSON,
    defaultValue: {},
  })
  assignee!: Record<string, any>;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Associations
  @BelongsTo(() => Organization)
  organization!: Organization;

  @BelongsTo(() => Workflow)
  workflow!: Workflow;

  @BelongsTo(() => Department)
  department!: Department;

  @HasMany(() => WorkflowInstanceStage)
  instances!: WorkflowInstanceStage[];
}

export interface StageAttributes {
  id: number;
  organizationId: number;
  workflowId: number;
  name: string;
  step: number;
  requiresInternalLoop: boolean;
  departmentId?: number;
  fields: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}
