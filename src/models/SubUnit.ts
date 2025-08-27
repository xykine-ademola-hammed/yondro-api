import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  CreatedAt,
  UpdatedAt,
  BelongsTo,
  ForeignKey,
} from "sequelize-typescript";
import { Position } from "./Position";
import { Employee } from "./Employee";
import { Unit } from "./Unit";

@Table({
  tableName: "SubUnits",
  timestamps: true,
  underscored: true,
})
export class SubUnit extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  name!: string;

  @ForeignKey(() => Unit)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  unitId!: number;

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

  @BelongsTo(() => Unit)
  unit!: Unit;
}

export interface UnitAttributes {
  id: number;
  unitId: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UnitCreationAttributes
  extends Omit<UnitAttributes, "id" | "createdAt" | "updatedAt"> {}
