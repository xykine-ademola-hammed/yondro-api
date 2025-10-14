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
  tableName: "audit_events",
  timestamps: false,
})
export default class AuditEvent extends Model {
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
    allowNull: true,
  })
  declare userId?: number;

  @ForeignKey(() => Employee)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare actorId?: number;

  @Index
  @Column({
    type: DataType.STRING(64),
    allowNull: false,
  })
  declare eventType: string;

  @Column({
    type: DataType.BLOB,
    allowNull: true,
  })
  declare ip?: Buffer;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  declare userAgent?: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  declare meta?: object;

  @Index
  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  declare createdAt: Date;

  @BelongsTo(() => Employee, "userId")
  declare user: Employee;

  @BelongsTo(() => Employee, "actorId")
  declare actor: Employee;
}
