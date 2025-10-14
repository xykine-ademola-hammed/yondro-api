import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  ForeignKey,
  HasMany,
} from "sequelize-typescript";
import { Employee } from "./Employee";
import { Organization } from "./Organization";
import { Department } from "./Department";
import VoucherLine from "./VoucherLine";
import ApprovalAction from "./ApprovalAction";
import Commitment from "./Commitment";
import Payment from "./Payment";

export type VoucherStatus =
  | "draft"
  | "submitted"
  | "approved_l1"
  | "approved_l2"
  | "approved_l3"
  | "finance_approved"
  | "posted"
  | "paid"
  | "rejected"
  | "cancelled"
  | "voided";
export type VoucherPriority = "low" | "medium" | "high" | "urgent";

@Table({
  tableName: "vouchers",
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ["organization_id"],
    },
    {
      fields: ["requester_id"],
    },
    {
      fields: ["status"],
    },
    {
      fields: ["created_at"],
    },
  ],
})
export default class Voucher extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    unique: true,
  })
  voucher_number!: string;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  organization_id!: number;

  @ForeignKey(() => Employee)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  requester_id!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  payee_name!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  payee_address?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  purpose!: string;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
  })
  total_amount!: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.0,
  })
  tax_amount!: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
  })
  net_amount!: number;

  @Column({
    type: DataType.STRING(3),
    allowNull: false,
    defaultValue: "USD",
  })
  currency!: string;

  @Column({
    type: DataType.ENUM(
      "draft",
      "submitted",
      "approved_l1",
      "approved_l2",
      "approved_l3",
      "finance_approved",
      "posted",
      "paid",
      "rejected",
      "cancelled",
      "voided"
    ),
    allowNull: false,
    defaultValue: "draft",
  })
  status!: VoucherStatus;

  @Column({
    type: DataType.ENUM("low", "medium", "high", "urgent"),
    allowNull: false,
    defaultValue: "medium",
  })
  priority!: VoucherPriority;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  due_date?: Date;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  invoice_number?: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true,
  })
  po_number?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  attachment_count!: number;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  rejection_reason?: string;

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
  @BelongsTo(() => Organization)
  organization!: Organization;

  @BelongsTo(() => Employee, "requester_id")
  requester!: Employee;

  @HasMany(() => VoucherLine)
  voucherLines!: VoucherLine[];

  @HasMany(() => ApprovalAction)
  approvalActions!: ApprovalAction[];

  @HasMany(() => Commitment)
  commitments!: Commitment[];

  @HasMany(() => Payment)
  payments!: Payment[];
}
