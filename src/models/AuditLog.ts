import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  ForeignKey,
} from "sequelize-typescript";
import { Employee } from "./Employee";
import { Organization } from "./Organization";

@Table({
  tableName: "audit_logs",
  timestamps: false,
  underscored: true,
  indexes: [
    {
      fields: ["organization_id"],
    },
    {
      fields: ["entity_type", "entity_id"],
    },
    {
      fields: ["created_at"],
    },
  ],
})
export default class AuditLog extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id!: number;

  @ForeignKey(() => Organization)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  organization_id!: number;

  @ForeignKey(() => Employee)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  actor_id?: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  entity_type!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  entity_id!: number;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
  })
  action!: string;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  old_values?: object;

  @Column({
    type: DataType.JSON,
    allowNull: true,
  })
  new_values?: object;

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
    type: DataType.STRING(256),
    allowNull: true,
  })
  hash?: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  created_at!: Date;

  // Associations
  @BelongsTo(() => Organization)
  organization!: Organization;

  @BelongsTo(() => Employee, "actor_id")
  actor!: Employee;
}
