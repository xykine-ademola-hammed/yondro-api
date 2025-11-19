// inbox-repository.ts
import { Sequelize, QueryTypes } from "sequelize";

export interface WorkflowInboxFilter {
  organizationId?: number;
  assignedToUserId?: number;
  departmentId?: number;
  employeeId?: number;
  status?: string;
  formId?: number;
  limit?: number;
  offset?: number;
}

export interface WorkflowInboxRow {
  id: number;
  organizationId: number;
  workflowId: number | null;
  formId: number | null;
  formResponses: any;
  approvedFormUrl: string | null;
  requestorId: number;
  parentRequestId: number | null;
  createdBy: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  workflow?: any;
  stage?: any;
  requestor?: any;
}

export interface WorkflowInboxPage {
  rows: WorkflowInboxRow[];
  totalItems: number;
  totalPages: number;
  page: number;
  limit: number;
}

export const WORKFLOW_INBOX_COUNT_SQL = `
  SELECT
    COUNT(DISTINCT wr.id) AS totalItems
  FROM workflow_requests wr
  INNER JOIN workflow_instance_stages s
    ON s.workflow_request_id = wr.id
   AND s.assigned_to_user_id = :assignedToUserId
  LEFT JOIN employees e
    ON wr.requestor_id = e.id
  WHERE
    wr.organization_id = :organizationId
    AND (:departmentId IS NULL OR e.department_id = :departmentId)
    AND (:employeeId  IS NULL OR e.id           = :employeeId)
    AND (:status      IS NULL OR wr.status      = :status)
    AND (:formId      IS NULL OR wr.form_id     = :formId)
`;

export const WORKFLOW_INBOX_SQL_CTE = `
WITH filtered_requests AS (
  SELECT
    wr.id,
    MAX(wr.created_at) AS maxCreatedAt
  FROM workflow_requests wr
  INNER JOIN workflow_instance_stages s
    ON s.workflow_request_id = wr.id
   AND s.assigned_to_user_id = :assignedToUserId
  LEFT JOIN employees e
    ON wr.requestor_id = e.id
  LEFT JOIN workflow_requests pwr
    ON wr.parent_request_id = pwr.id
  LEFT JOIN employees pe
    ON pwr.requestor_id = pe.id
  WHERE
    wr.organization_id = :organizationId
    AND ((:departmentId IS NULL OR e.department_id = :departmentId) OR (:departmentId IS NULL OR pe.department_id = :departmentId))
    AND ((:employeeId  IS NULL OR pwr.requestor_id  = :employeeId) OR (:employeeId  IS NULL OR wr.requestor_id  = :employeeId))
    AND (:status      IS NULL OR wr.status      = :status)
    AND (:formId      IS NULL OR wr.form_id     = :formId)
  GROUP BY wr.id
  ORDER BY maxCreatedAt DESC
  LIMIT :offset, :limit
),
latest_stage AS (
  SELECT
    s.*,
    ROW_NUMBER() OVER (
      PARTITION BY s.workflow_request_id, s.assigned_to_user_id
      ORDER BY s.step ASC, s.created_at DESC
    ) AS rn
  FROM workflow_instance_stages s
  WHERE s.assigned_to_user_id = :assignedToUserId
)

SELECT
  wr.id,
  wr.organization_id AS organizationId,
  wr.workflow_id     AS workflowId,
  wr.form_id         AS formId,
  wr.form_responses  AS formResponses,
  wr.approved_form_url AS approvedFormUrl,
  wr.requestor_id    AS requestorId,
  wr.parent_request_id AS parentRequestId,
  wr.created_by      AS createdBy,
  wr.status          AS status,
  wr.created_at      AS createdAt,
  wr.updated_at      AS updatedAt,

  w.id              AS "workflow.id",
  w.organization_id AS "workflow.organizationId",
  w.form_id         AS "workflow.formId",
  w.name            AS "workflow.name",
  w.description     AS "workflow.description",
  w.is_active       AS "workflow.isActive",
  w.is_auto_trigger AS "workflow.isAutoTrigger",
  w.created_at      AS "workflow.createdAt",
  w.updated_at      AS "workflow.updatedAt",

  ls.id                  AS "stage.id",
  ls.organization_id     AS "stage.organizationId",
  ls.workflow_request_id AS "stage.workflowRequestId",
  ls.stage_name          AS "stage.stageName",
  ls.step                AS "stage.step",
  ls.assigned_to_user_id AS "stage.assignedToUserId",
  ls.status              AS "stage.status",
  ls.field_responses     AS "stage.fieldResponses",
  ls.stage_id            AS "stage.stageId",
  ls.parent_step         AS "stage.parentStep",
  ls.is_sub_stage        AS "stage.isSubStage",
  ls.is_resubmission     AS "stage.isResubmission",
  ls.sent_back_to_stage_id AS "stage.sentBackToStageId",
  ls.acted_by_user_id    AS "stage.actedByUserId",
  ls.acted_at            AS "stage.actedAt",
  ls.comment             AS "stage.comment",
  ls.created_at          AS "stage.createdAt",
  ls.updated_at          AS "stage.updatedAt",

  e.id                  AS "requestor.id",
  e.first_name          AS "requestor.firstName",
  e.last_name           AS "requestor.lastName",
  e.email               AS "requestor.email",
  e.phone               AS "requestor.phone",
  e.role                AS "requestor.role",
  e.permissions         AS "requestor.permissions",
  e.is_active           AS "requestor.isActive",
  e.organization_id     AS "requestor.organizationId",
  e.school_or_office_id AS "requestor.schoolOrOfficeId",
  e.position_id         AS "requestor.positionId",
  e.department_id       AS "requestor.departmentId",
  e.unit_id             AS "requestor.unitId",
  e.last_password_reset_at AS "requestor.lastPasswordResetAt",
  e.created_at          AS "requestor.createdAt",
  e.updated_at          AS "requestor.updatedAt",
  e.photo_url           AS "requestor.photoUrl",

  d.id                  AS "requestor.department.id",
  d.organization_id     AS "requestor.department.organizationId",
  d.school_or_office_id AS "requestor.department.schoolOrOfficeId",
  d.name                AS "requestor.department.name",
  d.description         AS "requestor.department.description",
  d.finance_code        AS "requestor.department.financeCode",
  d.is_active           AS "requestor.department.isActive",
  d.created_at          AS "requestor.department.createdAt",
  d.updated_at          AS "requestor.department.updatedAt",

  p.id                  AS "requestor.position.id",
  p.organization_id     AS "requestor.position.organizationId",
  p.school_or_office_id AS "requestor.position.schoolOrOfficeId",
  p.department_id       AS "requestor.position.departmentId",
  p.unit_id             AS "requestor.position.unitId",
  p.title               AS "requestor.position.title",
  p.category            AS "requestor.position.category",
  p.description         AS "requestor.position.description",
  p.is_active           AS "requestor.position.isActive",
  p.parent_position_id  AS "requestor.position.parentPositionId",
  p.hierarchy_level     AS "requestor.position.hierarchyLevel",
  p.hierarchy_path      AS "requestor.position.hierarchyPath",
  p.created_at          AS "requestor.position.createdAt",
  p.updated_at          AS "requestor.position.updatedAt"

FROM filtered_requests fr
JOIN workflow_requests wr
  ON wr.id = fr.id
LEFT JOIN workflows w
  ON wr.workflow_id = w.id
LEFT JOIN latest_stage ls
  ON ls.workflow_request_id = wr.id
 AND ls.rn = 1            -- pick a single stage row per request
LEFT JOIN employees e
  ON wr.requestor_id = e.id
LEFT JOIN departments d
  ON e.department_id = d.id
LEFT JOIN positions p
  ON e.position_id = p.id

ORDER BY wr.created_at DESC;
`;

export function buildInboxParams(filters: WorkflowInboxFilter) {
  return {
    organizationId: filters.organizationId,
    assignedToUserId: filters.assignedToUserId,
    departmentId: filters.departmentId ?? null,
    employeeId: filters.employeeId ?? null,
    status: filters.status ?? null,
    formId: filters.formId ?? null,
    limit: filters.limit ?? 10,
    offset: filters.offset ?? 0,
  };
}
