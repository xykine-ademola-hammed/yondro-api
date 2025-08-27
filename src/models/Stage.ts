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
    type: DataType.STRING(255),
    allowNull: true,
  })
  instruction!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  step!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  parentStep!: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isSubStage!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isRequestor!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isRequestorDepartment!: boolean;

  @ForeignKey(() => Department)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  assigneeDepartmentId?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  assigneePositionId?: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  assigineeLookupField!: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isRequireApproval!: boolean;

  @Column({
    type: DataType.JSON,
    defaultValue: {},
  })
  formFields!: Record<string, any>;

  @Column({
    type: DataType.JSON,
    defaultValue: {},
  })
  formSections!: Record<string, any>;

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
  instruction?: string;
  step: number;
  parentStep: number;
  isSubStage: boolean;
  isRequestor: boolean;
  isRequestorDepartment: boolean;
  assigneeDepartmentId?: number;
  assigneePositionId?: number;
  assigineeLookupField: string;
  isRequireApproval: boolean;
  formFields: Record<string, any>;
  formSections: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}
