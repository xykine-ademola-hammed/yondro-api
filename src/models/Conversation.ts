// models/conversation.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  CreatedAt,
  UpdatedAt,
} from "sequelize-typescript";
import { WorkflowRequest } from "./WorkflowRequest";
import { Message } from "./Message";

@Table({
  tableName: "conversations",
  timestamps: true,
  underscored: true,
})
export class Conversation extends Model {
  @Column({
    type: DataType.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  })
  id!: number;

  /** Optional: if you want multi-tenant org-level conversations */
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  organizationId?: number | null;

  /**
   * The entity this conversation is attached to.
   * In your case: WorkflowRequest.id
   */
  @ForeignKey(() => WorkflowRequest)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "entity_id",
  })
  entityId!: number;

  /** Optional: entity type, if later you want polymorphism */
  @Column({
    type: DataType.STRING(100),
    allowNull: true,
    field: "entity_type",
  })
  entityType?: string | null;

  /** Optional: short title/subject for the conversation */
  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  subject?: string | null;

  /**
   * JSON column storing an array of Employee IDs.
   * Exposed as number[] in TypeScript via custom getter/setter.
   */
  @Column({
    type: DataType.JSON,
    allowNull: true,
    field: "member_ids",
    get(this: Conversation) {
      const raw = this.getDataValue("memberIds") as unknown;

      if (Array.isArray(raw)) {
        // e.g. [1, "2", 3] -> [1, 2, 3]
        return raw
          .map((v) => (typeof v === "string" ? Number(v) : v))
          .filter((v) => Number.isFinite(v)) as number[];
      }

      if (typeof raw === "string") {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            return parsed
              .map((v) => (typeof v === "string" ? Number(v) : v))
              .filter((v) => Number.isFinite(v)) as number[];
          }
        } catch {
          // fall through
        }
      }

      // default: empty list
      return [] as number[];
    },
    set(this: Conversation, value: unknown) {
      if (Array.isArray(value)) {
        const cleaned = value
          .map((v) => (typeof v === "string" ? Number(v) : v))
          .filter((v) => Number.isFinite(v)) as number[];
        this.setDataValue("memberIds", cleaned);
        return;
      }

      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) {
            const cleaned = parsed
              .map((v: any) => (typeof v === "string" ? Number(v) : v))
              .filter((v: any) => Number.isFinite(v)) as number[];
            this.setDataValue("memberIds", cleaned);
            return;
          }
        } catch {
          // ignore parse error, store empty array
        }
      }

      // Fallback for anything else
      this.setDataValue("memberIds", []);
    },
  })
  declare memberIds: number[];

  /** Optional: who created the conversation (Employee.id) */
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  createdBy?: number | null;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Associations
  @BelongsTo(() => WorkflowRequest, "entityId")
  request!: WorkflowRequest;

  @HasMany(() => Message)
  messages!: Message[];
}
