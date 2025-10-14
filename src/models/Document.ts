import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Default,
  CreatedAt,
  UpdatedAt,
  DeletedAt,
} from "sequelize-typescript";

/**
 * The Document model represents files or documents associated with various entities.
 */
@Table({
  tableName: "documents",
  timestamps: true,
  paranoid: true,
  freezeTableName: true, // don't pluralize
})
export class Document extends Model<Document, DocumentCreationAttributes> {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  entityId!: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  entityType!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  url!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  fieldName!: string;

  @CreatedAt
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  createdAt!: Date;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  createdBy?: number;

  @UpdatedAt
  @Default(DataType.NOW)
  @Column(DataType.DATE)
  updatedAt!: Date;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  updatedBy?: number;

  @DeletedAt
  @AllowNull(true)
  @Column(DataType.DATE)
  deletedAt?: Date;

  @AllowNull(true)
  @Column(DataType.INTEGER)
  deletedBy?: number;
}

export interface DocumentAttributes {
  id: number;
  entityId: number;
  entityType: string;
  fieldName: string;
  url: string;
  createdBy?: number;
}

export interface DocumentCreationAttributes
  extends Omit<DocumentAttributes, "id" | "createdAt" | "updatedAt"> {}
