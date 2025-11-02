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
  Index,
} from "sequelize-typescript";
import { Organization } from "./Organization";
import { Position } from "./Position";
import { Employee } from "./Employee";
import { Department } from "./Department";

@Table({
  tableName: "school_or_offices", // <= safer across OS/filesystems
  timestamps: true,
  underscored: true,
})
export class SchoolOrOffice extends Model<
  SchoolOrOfficeAttributes,
  SchoolOrOfficeCreationAttributes
> {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  id!: number;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  organizationId!: number;

  @Column({ type: DataType.STRING(255), allowNull: false, field: "name" })
  name!: string;

  @Column({ type: DataType.TEXT, allowNull: true, field: "description" })
  description?: string | null;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
    field: "finance_code",
  })
  financeCode?: string | null;

  @Column({ type: DataType.BOOLEAN, defaultValue: true, field: "is_active" })
  isActive!: boolean;

  @CreatedAt @Column({ field: "created_at" }) createdAt!: Date;
  @UpdatedAt @Column({ field: "updated_at" }) updatedAt!: Date;

  // Associations
  @BelongsTo(() => Organization, {
    foreignKey: "organizationId",
    onDelete: "CASCADE", // or 'RESTRICT' if you never want auto-delete
    onUpdate: "CASCADE",
  })
  organization!: Organization;

  @HasMany(() => Department)
  departments!: Department[];

  @HasMany(() => Position)
  positions!: Position[];

  @HasMany(() => Employee)
  employees!: Employee[];
}

export interface SchoolOrOfficeAttributes {
  id: number;
  organizationId: number;
  name: string;
  description?: string | null;
  financeCode?: string | null;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SchoolOrOfficeCreationAttributes
  extends Omit<SchoolOrOfficeAttributes, "id" | "createdAt" | "updatedAt"> {}
