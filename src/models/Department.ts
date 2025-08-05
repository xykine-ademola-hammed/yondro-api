import { Table, Column, Model, DataType, HasMany, CreatedAt, UpdatedAt, ForeignKey, BelongsTo } from 'sequelize-typescript';
import { Organization } from './Organization';
import { Position } from './Position';
import { Employee } from './Employee';
import { Stage } from './Stage';

@Table({
  tableName: 'departments',
  timestamps: true,
  underscored: true,
})
export class Department extends Model {
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

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Associations
  @BelongsTo(() => Organization)
  organization!: Organization;

  @HasMany(() => Position)
  positions!: Position[];

  @HasMany(() => Employee)
  employees!: Employee[];

  @HasMany(() => Stage)
  stages!: Stage[];
}

export interface DepartmentAttributes {
  id: number;
  organizationId: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DepartmentCreationAttributes extends Omit<DepartmentAttributes, 'id' | 'createdAt' | 'updatedAt'> {}