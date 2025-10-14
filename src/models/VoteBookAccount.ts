import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  ForeignKey,
  HasMany,
} from "sequelize-typescript";
import FiscalYear from "./FiscalYear";
import { Department } from "./Department";
import NcoaCode from "./NcoaCode";
import VoucherLine from "./VoucherLine";
import Commitment from "./Commitment";
import BudgetAdjustment from "./BudgetAdjustment";

export type AccountType =
  | "asset"
  | "liability"
  | "equity"
  | "revenue"
  | "expense";
export type AccountClass =
  | "operational"
  | "capital"
  | "personnel"
  | "maintenance"
  | "emergency";

@Table({
  tableName: "vote_book_accounts",
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ["fiscal_year_id", "code"],
    },
  ],
})
export default class VoteBookAccount extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  code!: string;

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

  @ForeignKey(() => FiscalYear)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  fiscal_year_id!: number;

  @ForeignKey(() => Department)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  department_id?: number;

  @ForeignKey(() => VoteBookAccount)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  parent_id?: number;

  @Column({
    type: DataType.ENUM("asset", "liability", "equity", "revenue", "expense"),
    allowNull: false,
  })
  account_type!: AccountType;

  @Column({
    type: DataType.ENUM(
      "operational",
      "capital",
      "personnel",
      "maintenance",
      "emergency"
    ),
    allowNull: false,
  })
  account_class!: AccountClass;

  @ForeignKey(() => NcoaCode)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  ncoa_code_id?: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.0,
  })
  allocation_base!: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.0,
  })
  sum_adjust_in!: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.0,
  })
  sum_adjust_out!: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.0,
  })
  sum_transfer_in!: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.0,
  })
  sum_transfer_out!: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.0,
  })
  carryover!: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.0,
  })
  committed!: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.0,
  })
  spent!: number;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  soft_ceiling!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  hard_ceiling!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  is_frozen!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  is_active!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  approval_required!: boolean;

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
  @BelongsTo(() => FiscalYear)
  fiscalYear!: FiscalYear;

  @BelongsTo(() => Department)
  department!: Department;

  @BelongsTo(() => VoteBookAccount, "parent_id")
  parent!: VoteBookAccount;

  @HasMany(() => VoteBookAccount, "parent_id")
  children!: VoteBookAccount[];

  @BelongsTo(() => NcoaCode)
  ncoaCode!: NcoaCode;

  @HasMany(() => VoucherLine)
  voucherLines!: VoucherLine[];

  @HasMany(() => Commitment)
  commitments!: Commitment[];

  @HasMany(() => BudgetAdjustment, "from_account_id")
  outgoingAdjustments!: BudgetAdjustment[];

  @HasMany(() => BudgetAdjustment, "to_account_id")
  incomingAdjustments!: BudgetAdjustment[];

  // Computed field
  get calculatedAvailable(): number {
    const allocationBase = Number(this.allocation_base) || 0;
    const sumAdjustIn = Number(this.sum_adjust_in) || 0;
    const sumAdjustOut = Number(this.sum_adjust_out) || 0;
    const sumTransferIn = Number(this.sum_transfer_in) || 0;
    const sumTransferOut = Number(this.sum_transfer_out) || 0;
    const carryover = Number(this.carryover) || 0;
    const committed = Number(this.committed) || 0;
    const spent = Number(this.spent) || 0;

    return (
      allocationBase +
      sumAdjustIn -
      sumAdjustOut +
      sumTransferIn -
      sumTransferOut +
      carryover -
      (committed + spent)
    );
  }
}
