import { QueryTypes } from "sequelize";
import { WorkflowInstanceStageStatus } from "../types";
import sequelize from "../config/database";

export interface PendingInboxParams {
  organizationId?: number;
  assignedToUserId?: number;
  departmentId?: number | null;
  employeeId?: number | null;
  status?: WorkflowInstanceStageStatus;
  formId?: number | null;
  limit?: number;
  offset?: number;
}

export interface PendingInboxRow {
  stageId: number;
  stageName: string;
  stageStatus: string;
  stageStep: string;
  stageCreatedAt: Date;
  stageUpdatedAt: Date;

  requestId: number;
  requestStatus: string;
  requestCreatedAt: Date;
  requestUpdatedAt: Date;
  requestFormId: number;
  requestWorkflowId: number;

  workflowId: number;
  workflowFormId: number;
  workflowName: string;
  workflowDescription: string | null;

  requestorId: number;
  requestorFirstName: string;
  requestorLastName: string;
  requestorEmail: string;
  requestorDepartmentId: number | null;
}

export interface PendingInboxResult {
  items: PendingInboxRow[];
  totalItems: number;
  totalPages: number;
  page: number;
  limit: number;
}

export async function findUserInboxWithCTE(
  params: PendingInboxParams
): Promise<PendingInboxResult> {
  const {
    organizationId,
    assignedToUserId,
    departmentId = null,
    employeeId = null,
    status = WorkflowInstanceStageStatus.PENDING,
    formId = null,
    limit = 10,
    offset = 0,
  } = params;

  /**
   * CTE structure:
   * 1) filtered_stages:
   *    - All workflow_instance_stages that match:
   *      organizationId, assignedToUserId, status
   *    - NO limit/offset here (so we can count properly).
   *
   * 2) joined_rows:
   *    - filtered_stages -> workflow_requests (wr)
   *    - wr -> workflows (w)
   *    - wr -> employees (e as requestor)
   *    - Apply optional filters: departmentId, formId, employeeId
   *
   * Final SELECT:
   *    - SELECT joined_rows.*, COUNT(*) OVER () AS total_items
   *    - ORDER BY stageCreatedAt DESC, stageId DESC
   *    - LIMIT/OFFSET applied here only
   */

  const sql2 = `WITH filtered_stages AS (
  SELECT
    wis.*,
    s.action_unit_type
  FROM workflow_instance_stages AS wis
  JOIN stages AS s
    ON s.id = wis.stage_id
    AND s.organization_id = :organizationId
  WHERE
    wis.organization_id       = :organizationId
    AND wis.assigned_to_user_id = :assignedToUserId
    AND wis.status            = :stageStatus
),

joined_rows AS (
  SELECT
    -- Stage (from filtered_stages)
    fs.id                AS stageId,
    fs.stage_name        AS stageName,
    fs.status            AS stageStatus,
    fs.step              AS stageStep,
    fs.created_at        AS stageCreatedAt,
    fs.updated_at        AS stageUpdatedAt,
    fs.action_unit_type  AS actionUnitType,
    fs.action_unit_group_id AS actionUnitGroupId,

    -- WorkflowRequest
    wr.id                AS requestId,
    wr.status            AS requestStatus,
    wr.created_at        AS requestCreatedAt,
    wr.updated_at        AS requestUpdatedAt,
    wr.form_id           AS requestFormId,
    wr.workflow_id       AS requestWorkflowId,

    -- Workflow
    w.id                 AS workflowId,
    w.form_id            AS workflowFormId,
    w.name               AS workflowName,
    w.description        AS workflowDescription,

    -- Requestor (Employee)
    e.id                 AS requestorId,
    e.first_name         AS requestorFirstName,
    e.last_name          AS requestorLastName,
    e.email              AS requestorEmail,
    e.department_id      AS requestorDepartmentId,
    d.name               AS departmentName
  FROM filtered_stages AS fs
  INNER JOIN workflow_requests AS wr
    ON wr.id = fs.workflow_request_id
    AND wr.organization_id = :organizationId
  INNER JOIN workflows AS w
    ON w.id = wr.workflow_id
    AND w.organization_id = :organizationId
  INNER JOIN employees AS e
    ON e.id = wr.requestor_id
    AND e.organization_id = :organizationId
  LEFT JOIN departments AS d
    ON d.id = e.department_id
   AND d.organization_id = :organizationId
  WHERE 1 = 1
    AND (:departmentId IS NULL OR e.department_id = :departmentId)
    AND (:formId      IS NULL OR w.form_id       = :formId)
    AND (:employeeId  IS NULL OR wr.requestor_id = :employeeId)
),

messages_agg AS (
  SELECT
    m.entity_id                 AS requestId,
    COUNT(*)                    AS messageCount,
    MAX(m.created_at)           AS lastMessageAt,
    JSON_ARRAYAGG(m.member_ids) AS messageMemberIds
  FROM messages m
  WHERE
    m.organization_id = :organizationId
    AND m.entity_type  = 'REQUEST'
    -- ✅ Only messages where member_ids contains the assignedToUserId
    AND JSON_CONTAINS(
          m.member_ids,
          CAST(:assignedToUserId AS JSON),
          '$'
        )
  GROUP BY
    m.entity_id
),

joined_with_messages AS (
  SELECT
    jr.*,
    ma.messageCount,
    ma.messageMemberIds,
    ma.lastMessageAt,
    (SELECT COUNT(DISTINCT COALESCE(jr2.actionUnitGroupId, jr2.stageId)) FROM joined_rows jr2) AS total_items,
    ROW_NUMBER() OVER (
      PARTITION BY COALESCE(jr.actionUnitGroupId, jr.stageId)
      ORDER BY jr.stageCreatedAt DESC, jr.stageId DESC
    ) AS rn
  FROM joined_rows AS jr
  LEFT JOIN messages_agg AS ma
    ON ma.requestId = jr.requestId
)

SELECT
  *
FROM joined_with_messages
WHERE rn = 1
ORDER BY stageCreatedAt DESC, stageId DESC
LIMIT :limit OFFSET :offset;
`;

  const sql = `WITH filtered_stages AS (
  SELECT
    wis.*,
    s.action_unit_type
  FROM workflow_instance_stages AS wis
  JOIN stages AS s
    ON s.id = wis.stage_id
    AND s.organization_id = :organizationId
  WHERE
    wis.organization_id       = :organizationId
    AND wis.assigned_to_user_id = :assignedToUserId
    AND wis.status            = :stageStatus
),

joined_rows AS (
  SELECT
    -- Stage (from filtered_stages)
    fs.id                AS stageId,
    fs.stage_name        AS stageName,
    fs.status            AS stageStatus,
    fs.step              AS stageStep,
    fs.created_at        AS stageCreatedAt,
    fs.updated_at        AS stageUpdatedAt,
    fs.action_unit_type  AS actionUnitType,
    fs.action_unit_group_id AS actionUnitGroupId,

    -- WorkflowRequest
    wr.id                AS requestId,
    wr.status            AS requestStatus,
    wr.created_at        AS requestCreatedAt,
    wr.updated_at        AS requestUpdatedAt,
    wr.form_id           AS requestFormId,
    wr.workflow_id       AS requestWorkflowId,

    -- Workflow
    w.id                 AS workflowId,
    w.form_id            AS workflowFormId,
    w.name               AS workflowName,
    w.description        AS workflowDescription,

    -- Requestor (Employee)
    e.id                 AS requestorId,
    e.first_name         AS requestorFirstName,
    e.last_name          AS requestorLastName,
    e.email              AS requestorEmail,
    e.department_id      AS requestorDepartmentId,
    d.name               AS departmentName
  FROM filtered_stages AS fs
  INNER JOIN workflow_requests AS wr
    ON wr.id = fs.workflow_request_id
    AND wr.organization_id = :organizationId
  INNER JOIN workflows AS w
    ON w.id = wr.workflow_id
    AND w.organization_id = :organizationId
  INNER JOIN employees AS e
    ON e.id = wr.requestor_id
    AND e.organization_id = :organizationId
  LEFT JOIN departments AS d
    ON d.id = e.department_id
   AND d.organization_id = :organizationId
  WHERE 1 = 1
    AND (:departmentId IS NULL OR e.department_id = :departmentId)
    AND (:formId      IS NULL OR w.form_id       = :formId)
    AND (:employeeId  IS NULL OR wr.requestor_id = :employeeId)
),

messages_agg AS (
  SELECT
    m.entity_id                 AS requestId,
    COUNT(*)                    AS messageCount,
    MAX(m.created_at)           AS lastMessageAt,
    JSON_ARRAYAGG(m.member_ids) AS messageMemberIds
  FROM messages m
  WHERE
    m.organization_id = :organizationId
    AND m.entity_type  = 'REQUEST'
    -- ✅ Only messages where member_ids contains the assignedToUserId
    AND JSON_CONTAINS(
          m.member_ids,
          CAST(:assignedToUserId AS JSON),
          '$'
        )
  GROUP BY
    m.entity_id
),

joined_with_messages AS (
  SELECT
    jr.*,
    ma.messageCount,
    ma.messageMemberIds,
    ma.lastMessageAt,
    COUNT(*) OVER () AS total_items
  FROM joined_rows AS jr
  LEFT JOIN messages_agg AS ma
    ON ma.requestId = jr.requestId
)

SELECT
  *
FROM joined_with_messages
ORDER BY stageCreatedAt DESC, stageId DESC
LIMIT :limit OFFSET :offset;

  `;

  console.log("---sql-----", sql);

  type RowWithCount = PendingInboxRow & { total_items: number };

  const rows = (await sequelize.query(sql2, {
    type: QueryTypes.SELECT,
    replacements: {
      organizationId,
      assignedToUserId,
      stageStatus: status,
      departmentId,
      formId,
      employeeId,
      limit,
      offset,
    },
  })) as RowWithCount[];

  const totalItems = rows.length > 0 ? Number(rows[0].total_items) : 0;
  const safeLimit = limit || 10;
  const totalPages = totalItems > 0 ? Math.ceil(totalItems / safeLimit) : 0;
  const page = safeLimit > 0 ? Math.floor(offset / safeLimit) + 1 : 1;

  const items: PendingInboxRow[] = rows.map(({ total_items, ...rest }) => rest);

  return {
    items,
    totalItems,
    totalPages,
    page,
    limit: safeLimit,
  };
}
