import { Table, Column, Model, DataType, HasMany, CreatedAt, UpdatedAt, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Organization } from './Organization';
import { Department } from './Department';
import { Employee } from './Employee';

@Table({
  tableName: 'positions',
  timestamps: true,
  underscored: true,
})
export class Position extends Model {
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

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  title!: string;

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
  @BelongsTo(() => Organization)
  organization!: Organization;

  @BelongsTo(() => Department)
  department!: Department;

  @HasMany(() => Employee)
  employees!: Employee[];
}

export interface PositionAttributes {
  id: number;
  organizationId: number;
  departmentId: number;
  title: string;
  description?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
