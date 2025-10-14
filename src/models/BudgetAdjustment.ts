import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  ForeignKey,
} from "sequelize-typescript";
import VoteBookAccount from "./VoteBookAccount";
import { Employee } from "./Employee";

export type AdjustmentType =
  | "SUPPLEMENT"
  | "REDUCTION"
  | "TRANSFER"
  | "CARRYFORWARD"
  | "REVERSAL";
export type AdjustmentStatus = "PENDING" | "APPROVED" | "REJECTED" | "POSTED";

@Table({
  tableName: "budget_adjustments",
  timestamps: true,
  underscored: true,
})
export default class BudgetAdjustment extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  organization_id!: number;

  @ForeignKey(() => VoteBookAccount)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  from_account_id?: number;

  @ForeignKey(() => VoteBookAccount)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  to_account_id!: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
  })
  amount!: number;

  @Column({
    type: DataType.ENUM(
      "SUPPLEMENT",
      "REDUCTION",
      "TRANSFER",
      "CARRYFORWARD",
      "REVERSAL"
    ),
    allowNull: false,
  })
  adjustment_type!: AdjustmentType;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  justification!: string;

  @ForeignKey(() => Employee)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  requestor_id!: number;

  @ForeignKey(() => Employee)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  approver_id?: number;

  @Column({
    type: DataType.ENUM("PENDING", "APPROVED", "REJECTED", "POSTED"),
    allowNull: false,
    defaultValue: "PENDING",
  })
  status!: AdjustmentStatus;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  approval_date?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  posted_date?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  effective_date!: Date;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  reference_number?: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  attachment_count!: number;

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
  @BelongsTo(() => VoteBookAccount, "from_account_id")
  fromAccount!: VoteBookAccount;

  @BelongsTo(() => VoteBookAccount, "to_account_id")
  toAccount!: VoteBookAccount;

  @BelongsTo(() => Employee, "requestor_id")
  requestor!: Employee;

  @BelongsTo(() => Employee, "approver_id")
  approver!: Employee;
}
