import {
  Table,
  Column,
  Model,
  DataType,
  Index,
  BelongsTo,
  ForeignKey,
} from "sequelize-typescript";
import { Employee } from "./Employee";

@Table({
  tableName: "password_resets",
  timestamps: false,
})
export default class PasswordReset extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  declare id: number;

  @ForeignKey(() => Employee)
  @Index
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  declare userId: number;

  @Column({
    type: DataType.CHAR(64),
    allowNull: false,
  })
  declare tokenHash: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare createdAt: Date;

  @Index
  @Column({
    type: DataType.DATE,
    allowNull: false,
  })
  declare expiresAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare usedAt?: Date;

  @Column({
    type: DataType.BLOB,
    allowNull: true,
  })
  declare requestIp?: Buffer;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  declare exchangeExpiresAt?: Date;

  @Column({
    type: DataType.CHAR(64),
    allowNull: true,
  })
  declare exchangeNonceHash?: string;

  @BelongsTo(() => Employee, "userId")
  declare user: Employee;
}
