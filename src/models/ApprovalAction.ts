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

export type ApprovalActionType = "approve" | "reject" | "return" | "delegate";

@Table({
  tableName: "approval_actions",
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ["voucher_id"],
    },
    {
      fields: ["actor_id"],
    },
    {
      fields: ["decision_date"],
    },
  ],
})
export default class ApprovalAction extends Model {
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
  actor_id!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 3,
    },
  })
  level!: number;

  @Column({
    type: DataType.ENUM("approve", "reject", "return", "delegate"),
    allowNull: false,
  })
  action!: ApprovalActionType;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  comment?: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  decision_date!: Date;

  @Column({
    type: DataType.STRING(45),
    allowNull: true,
  })
  ip_address?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  user_agent?: string;

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

  @BelongsTo(() => Employee, "actor_id")
  actor!: Employee;
}
