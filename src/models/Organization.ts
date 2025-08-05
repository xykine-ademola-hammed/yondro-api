import { Table, Column, Model, DataType, HasMany, CreatedAt, UpdatedAt } from 'sequelize-typescript';
import { Department } from './Department';
import { Position } from './Position';
import { Employee } from './Employee';
import { Workflow } from './Workflow';
import { Stage } from './Stage';
import { WorkflowRequest } from './WorkflowRequest';
import { WorkflowInstanceStage } from './WorkflowInstanceStage';

@Table({
  tableName: 'organizations',
  timestamps: true,
  underscored: true,
})
export class Organization extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
    unique: true,
  })
  name!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  isActive!: boolean;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Associations
  @HasMany(() => Department)
  departments!: Department[];

  @HasMany(() => Position)
  positions!: Position[];

  @HasMany(() => Employee)
  employees!: Employee[];

  @HasMany(() => Workflow)
  workflows!: Workflow[];

  @HasMany(() => Stage)
  stages!: Stage[];

  @HasMany(() => WorkflowRequest)
  workflowRequests!: WorkflowRequest[];

  @HasMany(() => WorkflowInstanceStage)
  workflowInstanceStages!: WorkflowInstanceStage[];
}

export interface OrganizationAttributes {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
