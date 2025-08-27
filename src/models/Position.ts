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
import { Department } from "./Department";
import { Employee } from "./Employee";
import { EmployeePosition } from "./EmployeePosition";
import { Unit } from "./Unit";
import { SchoolOrOffice } from "./SchoolOrOffice";

@Table({
  tableName: "positions",
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

  @ForeignKey(() => SchoolOrOffice)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  schoolOrOfficeId?: number;

  @ForeignKey(() => Department)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  departmentId?: number;

  @ForeignKey(() => Unit)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  unitId?: number;

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

  @ForeignKey(() => Position)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  parentPositionId?: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 1,
  })
  hierarchyLevel!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  hierarchyPath?: string;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Associations
  @BelongsTo(() => Organization)
  organization!: Organization;

  @BelongsTo(() => Department)
  department!: Department;

  @BelongsTo(() => SchoolOrOffice)
  schoolOrOffice!: SchoolOrOffice;

  @HasMany(() => Employee)
  employees!: Employee[];

  @BelongsTo(() => Position, {
    foreignKey: "parentPositionId",
    as: "parentPosition",
  })
  parentPosition?: Position;

  @BelongsTo(() => Unit, {
    foreignKey: "unitId",
    as: "unit",
  })
  unit?: Unit;

  @HasMany(() => Position, {
    foreignKey: "parentPositionId",
    as: "childPositions",
  })
  childPositions?: Position[];

  @HasMany(() => EmployeePosition)
  employeePositions!: EmployeePosition[];
}

export interface PositionAttributes {
  id: number;
  organizationId: number;
  departmentId: number;
  title: string;
  description?: string;
  isActive: boolean;
  hierarchyLevel: number;
  hierarchyPath?: string;
  parentPositionId?: number;
  schoolOrOfficeId?: number;
  unitId?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
