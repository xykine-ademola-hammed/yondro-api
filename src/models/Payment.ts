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
  | "other";
export type PaymentStatus =
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

  @ForeignKey(() => Voucher)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  voucher_id!: number;

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
    type: DataType.ENUM("bank_transfer", "check", "cash", "card", "other"),
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
  })
  payment_date!: Date;

  @Column({
    type: DataType.ENUM(
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

  // Associations
  @BelongsTo(() => Voucher)
  voucher!: Voucher;

  @BelongsTo(() => Employee, "processor_id")
  processor!: Employee;
}
