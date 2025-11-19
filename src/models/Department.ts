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
import { Position } from "./Position";
import { Employee } from "./Employee";
import { SchoolOrOffice } from "./SchoolOrOffice";
import { Unit } from "./Unit";

@Table({
  tableName: "departments",
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

  @ForeignKey(() => SchoolOrOffice)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  schoolOrOfficeId!: number;

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

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Associations
  @BelongsTo(() => Organization)
  organization!: Organization;

  // Associations
  @BelongsTo(() => SchoolOrOffice)
  schoolOrOffice!: SchoolOrOffice;

  @HasMany(() => Position)
  positions!: Position[];

  @HasMany(() => Unit)
  units!: Unit[];

  @HasMany(() => Employee)
  employees!: Employee[];
}

export interface DepartmentAttributes {
  id: number;
  organizationId: number;
  schoolOrOfficeId: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface DepartmentCreationAttributes
  extends Omit<DepartmentAttributes, "id" | "createdAt" | "updatedAt"> {}
