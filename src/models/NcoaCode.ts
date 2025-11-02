import { Table, Column, Model, DataType, HasMany } from "sequelize-typescript";
import VoteBookAccount from "./VoteBookAccount";

@Table({
  tableName: "ncoa_codes",
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ["code"],
    },
    {
      fields: ["economic_type"],
    },
    {
      fields: ["account_type"],
    },
    {
      fields: ["level"],
    },
  ],
})
export default class NcoaCode extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id!: number;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
  })
  code!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  economic_type!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  fg_title!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  state_title!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  lg_title!: string;

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
  })
  account_type!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5,
    },
  })
  level!: number;

  @Column({
    type: DataType.STRING(20),
    allowNull: false,
  })
  type!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: true,
  })
  is_active!: boolean;

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
  @HasMany(() => VoteBookAccount)
  voteBookAccounts!: VoteBookAccount[];
}
