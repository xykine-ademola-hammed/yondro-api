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
import { Stage } from "./Stage";
import { WorkflowRequest } from "./WorkflowRequest";

@Table({
  tableName: "workflows",
  timestamps: true,
  underscored: true,
})
export class Workflow extends Model {
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

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  formId!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
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

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isAutoTrigger!: boolean;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Associations
  @BelongsTo(() => Organization)
  organization!: Organization;

  @HasMany(() => Stage)
  stages!: Stage[];

  @HasMany(() => WorkflowRequest)
  requests!: WorkflowRequest[];
}

export interface WorkflowAttributes {
  id: number;
  organizationId: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
