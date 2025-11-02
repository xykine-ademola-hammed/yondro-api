import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  ForeignKey,
} from "sequelize-typescript";
import Voucher from "./Voucher";
import VoteBookAccount from "./VoteBookAccount";

@Table({
  tableName: "voucher_lines",
  timestamps: true,
  underscored: true,
})
export default class VoucherLine extends Model {
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

  @ForeignKey(() => VoteBookAccount)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  account_id!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  line_number!: number;

  @Column({
    type: DataType.STRING(500),
    allowNull: false,
  })
  description!: string;

  @Column({
    type: DataType.DECIMAL(10, 3),
    allowNull: false,
    defaultValue: 1.0,
  })
  quantity!: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
  })
  unit_cost!: number;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
  })
  total_amount!: number;

  @Column({
    type: DataType.STRING(10),
    allowNull: true,
  })
  tax_code?: string;

  @Column({
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0.0,
  })
  tax_amount!: number;

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

  @BelongsTo(() => VoteBookAccount)
  voteBookAccount!: VoteBookAccount;
}
