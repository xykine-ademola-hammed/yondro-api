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
import { Employee } from "./Employee";
import { Department } from "./Department";

@Table({
  tableName: "Units",
  timestamps: true,
  underscored: true,
})
export class Unit extends Model {
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
    allowNull: true,
    field: "department_id",
  })
  departmentId?: number | null;

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
    type: DataType.STRING(255),
    allowNull: true,
  })
  financeCode?: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  isActive!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  hasSubUnits!: boolean;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Associations
  @BelongsTo(() => Organization)
  organization!: Organization;

  @BelongsTo(() => Department, {
    foreignKey: "departmentId", // or { name: 'departmentId', field: 'department_id' }
    onDelete: "SET NULL",
    onUpdate: "CASCADE",
  })
  department?: Department;

  @HasMany(() => Employee)
  employees!: Employee[];
}

export interface UnitAttributes {
  id: number;
  organizationId: number;
  departmentId: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UnitCreationAttributes
  extends Omit<UnitAttributes, "id" | "createdAt" | "updatedAt"> {}
