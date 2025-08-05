import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
  HasMany,
} from "sequelize-typescript";
import { Organization } from "./Organization";
import { WorkflowRequest } from "./WorkflowRequest";
import { Employee } from "./Employee";
import { Stage } from "./Stage";
import { WorkflowInstanceStageStatus } from "../types";

@Table({
  tableName: "workflow_instance_stages",
  timestamps: true,
  underscored: true,
})
export class WorkflowInstanceStage extends Model {
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

  @ForeignKey(() => WorkflowRequest)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  workflowRequestId!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  stageName!: string;

  @Column({
    type: DataType.DECIMAL(10, 4),
    allowNull: false,
  })
  step!: number;

  @ForeignKey(() => Employee)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  assignedToUserId!: number;

  @Column({
    type: DataType.ENUM(...Object.values(WorkflowInstanceStageStatus)),
    defaultValue: WorkflowInstanceStageStatus.PENDING,
  })
  status!: WorkflowInstanceStageStatus;

  @Column({
    type: DataType.JSON,
    defaultValue: {},
  })
  fieldResponses!: Record<string, any>;

  @ForeignKey(() => Stage)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  stageId!: number;

  @ForeignKey(() => WorkflowInstanceStage)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  parentStageId?: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isSubStage!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isResubmission!: boolean;

  @ForeignKey(() => WorkflowInstanceStage)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  sentBackToStageId?: number;

  @ForeignKey(() => Employee)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  actedByUserId?: number;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  actedAt?: Date;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  comment?: string;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Associations
  @BelongsTo(() => Organization)
  organization!: Organization;

  @BelongsTo(() => WorkflowRequest, "workflowRequestId")
  request!: WorkflowRequest;

  @BelongsTo(() => Employee, "assignedToUserId")
  assignedTo!: Employee;

  @BelongsTo(() => Employee, "actedByUserId")
  actedBy!: Employee;

  @BelongsTo(() => Stage)
  stage!: Stage;

  @BelongsTo(() => WorkflowInstanceStage, "parentStageId")
  parentStage!: WorkflowInstanceStage;

  @HasMany(() => WorkflowInstanceStage, "parentStageId")
  subStages!: WorkflowInstanceStage[];
}

export interface WorkflowInstanceStageAttributes {
  id: number;
  organizationId: number;
  workflowRequestId: number;
  stageName: string;
  step: number;
  assignedToUserId: number;
  status: WorkflowInstanceStageStatus;
  fieldResponses: Record<string, any>;
  stageId: number;
  parentStageId?: number;
  isSubStage: boolean;
  isResubmission: boolean;
  sentBackToStageId?: number;
  actedByUserId?: number;
  actedAt?: Date;
  comment?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
