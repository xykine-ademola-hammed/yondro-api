import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  CreatedAt,
  UpdatedAt,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { Organization } from "./Organization";
import { Workflow } from "./Workflow";
import { Department } from "./Department";
import { WorkflowInstanceStage } from "./WorkflowInstanceStage";

@Table({
  tableName: "stages",
  timestamps: true,
  underscored: true,
})
export class Stage extends Model {
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
  organizationId!: number;

  @ForeignKey(() => Workflow)
  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  workflowId!: number;

  @Column({
    type: DataType.STRING(255),
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: true,
  })
  instruction!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  step!: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isResubmissionStage!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isPriorityComment!: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  parentStep!: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isSubStage!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isRequestor!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isRequestorParent!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  hasSplitAssignee!: boolean;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  assigneePositionId?: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  assigineeLookupField!: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  isRequireApproval!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  triggerVoucherCreation!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
  })
  triggerVotebookEntry!: boolean;

  @Column({
    type: DataType.JSON,
    defaultValue: {},
  })
  formFields!: Record<string, any>;

  @Column({
    type: DataType.JSON,
    defaultValue: {},
  })
  formSections!: Record<string, any>;

  @Column({
    type: DataType.JSON,
    defaultValue: {},
  })
  get splitPositions(): Record<string, any>[] {
    const raw = this.getDataValue("splitPositions") as unknown;
    // Already an array
    if (Array.isArray(raw)) return raw;
    // Cloud sometimes returns JSON as a string – parse it safely
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    // Anything else -> empty array
    return [];
  }

  set splitPositions(val: unknown) {
    // Accept string | string[] | unknown, normalize to string[]
    if (Array.isArray(val)) {
      this.setDataValue("splitPositions", val);
      return;
    }
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        this.setDataValue(
          "responseTypes",
          Array.isArray(parsed) ? parsed : [val]
        );
      } catch {
        this.setDataValue("responseTypes", [val]); // treat plain string as single item
      }
      return;
    }
    this.setDataValue("responseTypes", []); // fallback
  }

  @Column({
    type: DataType.JSON,
    defaultValue: {},
  })
  get responseTypes(): string[] {
    const raw = this.getDataValue("responseTypes") as unknown;

    // Already an array
    if (Array.isArray(raw)) return raw;

    // Cloud sometimes returns JSON as a string – parse it safely
    if (typeof raw === "string") {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }

    // Anything else -> empty array
    return [];
  }

  set responseTypes(val: unknown) {
    // Accept string | string[] | unknown, normalize to string[]
    if (Array.isArray(val)) {
      this.setDataValue("responseTypes", val);
      return;
    }
    if (typeof val === "string") {
      try {
        const parsed = JSON.parse(val);
        this.setDataValue(
          "responseTypes",
          Array.isArray(parsed) ? parsed : [val]
        );
      } catch {
        this.setDataValue("responseTypes", [val]); // treat plain string as single item
      }
      return;
    }
    this.setDataValue("responseTypes", []); // fallback
  }

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;

  // Associations
  @BelongsTo(() => Organization)
  organization!: Organization;

  @BelongsTo(() => Workflow)
  workflow!: Workflow;

  @HasMany(() => WorkflowInstanceStage)
  instances!: WorkflowInstanceStage[];
}

export interface StageAttributes {
  id: number;
  organizationId: number;
  workflowId: number;
  name: string;
  instruction?: string;
  step: number;
  parentStep: number;
  isSubStage: boolean;
  isRequestor: boolean;
  isRequestorParent: boolean;
  hasSplitAssignee: boolean;
  triggerVoucherCreation: boolean;
  triggerVotebookEntry: boolean;
  assigneePositionId?: number;
  assigineeLookupField: string;
  isRequireApproval: boolean;
  formFields: Record<string, any>;
  formSections: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
}
