// models/message.model.ts
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
import { Employee } from "./Employee";
import { WorkflowRequest } from "./WorkflowRequest";

@Table({
  tableName: "messages",
  timestamps: true,
  underscored: true,
})
export class Message extends Model {
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
   * The entity this message is attached to.
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

  /** Optional: short title/subject for the message thread */
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
    get(this: Message) {
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
    set(this: Message, value: unknown) {
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

  /** Sender of the message (Employee.id) */
  @ForeignKey(() => Employee)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: "sender_id",
  })
  senderId!: number;

  /** Optional: parent message (reply-to) */
  @ForeignKey(() => Message)
  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    field: "parent_message_id",
  })
  parentMessageId?: number | null;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  body!: string;

  /** Optional: message metadata (attachments, tags, etc) */
  @Column({
    type: DataType.JSON,
    allowNull: true,
    defaultValue: {},
  })
  metadata?: Record<string, any>;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Associations
  @BelongsTo(() => Employee, "senderId")
  sender!: Employee;

  @BelongsTo(() => WorkflowRequest, "entityId")
  entity!: WorkflowRequest;

  /** Parent message (if this is a reply) */
  @BelongsTo(() => Message, "parentMessageId")
  parentMessage?: Message | null;

  /** Replies to this message */
  @HasMany(() => Message, "parentMessageId")
  replies?: Message[];

  /**
   * Helper: load all Employee records for this.message.memberIds
   */
  async getMembers(): Promise<Employee[]> {
    const ids = this.memberIds;
    if (!ids || ids.length === 0) return [];
    return Employee.findAll({
      where: { id: ids },
    });
  }
}
