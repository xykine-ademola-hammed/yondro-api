import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  ForeignKey,
} from "sequelize-typescript";
import Voucher from "./Voucher";
import { Employee } from "./Employee";

export type PaymentMethod =
  | "bank_transfer"
  | "check"
  | "cash"
  | "card"
  | "gifmis-personnel"
  | "gifmis-capital"
  | "gifmis-overhead"
  | "tsa-revitalization"
  | "tsa-igr"
  | "tsa-tetfund"
  | "other";

export type PaymentStatus =
  | "processed"
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

@Table({
  tableName: "payments",
  timestamps: true,
  underscored: true,
})
export default class Payment extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  entityId!: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  entityType!: string;

  @ForeignKey(() => Employee)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  processor_id!: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
  })
  amount!: number;

  @Column({
    type: DataType.ENUM(
      "bank_transfer",
      "check",
      "cash",
      "card",
      "gifmis-personnel",
      "gifmis-capital",
      "gifmis-overhead",
      "tsa-revitalization",
      "tsa-igr",
      "tsa-tetfund",
      "other"
    ),
    allowNull: false,
  })
  payment_method!: PaymentMethod;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  payment_reference?: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  bank_reference?: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  payment_date!: Date;

  @Column({
    type: DataType.ENUM(
      "processed",
      "pending",
      "processing",
      "completed",
      "failed",
      "cancelled"
    ),
    allowNull: false,
    defaultValue: "pending",
  })
  status!: PaymentStatus;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes?: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  created_at!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  updated_at!: Date;

  @BelongsTo(() => Employee, "processor_id")
  processor!: Employee;
}
