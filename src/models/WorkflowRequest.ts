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
import { Employee } from "./Employee";
import { WorkflowInstanceStage } from "./WorkflowInstanceStage";
import { WorkflowRequestStatus } from "../types";

@Table({
  tableName: "workflow_requests",
  timestamps: true,
  underscored: true,
})
export class WorkflowRequest extends Model {
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
    type: DataType.INTEGER,
    allowNull: false,
  })
  formId!: number;

  @Column({
    type: DataType.JSON,
    defaultValue: {},
  })
  formResponses!: Record<string, any>;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  approvedFormUrl!: string;

  @ForeignKey(() => Employee)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  requestorId!: number;

  @ForeignKey(() => Employee)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  createdBy!: number;

  @Column({
    type: DataType.ENUM(...Object.values(WorkflowRequestStatus)),
    defaultValue: WorkflowRequestStatus.PENDING,
  })
  status!: WorkflowRequestStatus;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Associations
  @BelongsTo(() => Organization)
  organization!: Organization;

  @BelongsTo(() => Workflow)
  workflow!: Workflow;

  @BelongsTo(() => Employee, "requestorId")
  requestor!: Employee;

  @HasMany(() => WorkflowInstanceStage)
  stages!: WorkflowInstanceStage[];
}

export interface WorkflowRequestAttributes {
  id: number;
  organizationId: number;
  workflowId: number;
  requestorId: number;
  status: WorkflowRequestStatus;
  createdAt?: Date;
  updatedAt?: Date;
}
