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

export type CommitmentStatus = "active" | "released" | "converted";

@Table({
  tableName: "commitments",
  timestamps: true,
  underscored: true,
})
export default class Commitment extends Model {
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
    type: DataType.DECIMAL(15, 2),
    allowNull: false,
  })
  amount!: number;

  @Column({
    type: DataType.ENUM("active", "released", "converted"),
    allowNull: false,
    defaultValue: "active",
  })
  status!: CommitmentStatus;

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
