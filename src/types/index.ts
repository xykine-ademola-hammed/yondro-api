export interface PaginationOptions {
  page?: number;
  limit?: number;
  search?: string;
}

export interface PaginatedResponse<T> {
  rows: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export enum WorkflowRequestStatus {
  PENDING = "Pending",
  APPROVED = "Approved",
  REJECTED = "Rejected",
}

export enum WorkflowInstanceStageStatus {
  PENDING = "Pending",
  APPROVED = "Approved",
  REJECTED = "Rejected",
  CREATED = "Created",
  SUBMITTED = "Submitted",
  ACKNOWLEDGEMENT = "Acknowledged",
  PAYMENT = "Payment",
  PROCREMENT = "Procurement",
  RECOMMEND = "Recommend",
}

export const statusMapper = {
  Approve: WorkflowInstanceStageStatus.APPROVED,
  Reject: WorkflowInstanceStageStatus.REJECTED,
  Created: WorkflowInstanceStageStatus.CREATED,
  Submit: WorkflowInstanceStageStatus.SUBMITTED,
  Acknowledgement: WorkflowInstanceStageStatus.ACKNOWLEDGEMENT,
  Pending: WorkflowInstanceStageStatus.PENDING,
  Procurement: WorkflowInstanceStageStatus.PROCREMENT,
  Payment: WorkflowInstanceStageStatus.PAYMENT,
  Recommend: WorkflowInstanceStageStatus.RECOMMEND,
};

export enum InternalStageRole {
  INITIATOR = "Initiator",
  REVIEWER = "Reviewer",
  APPROVER = "Approver",
}

export interface StageCompletionData {
  stageId: number;
  action:
    | "Approve"
    | "Reject"
    | "Payment"
    | "Procurement"
    | "Submit"
    | "Acknowledgement";
  comment?: string;
  fieldResponses?: Record<string, any>;
  formResponses?: Record<string, any>;
  user?: any;
}

export interface InternalSendBackData {
  stageId: number;
  comment: string;
  sentBackToRole: InternalStageRole;
}

export interface NextStageResponse {
  currentStage: any;
  nextStage?: any;
  isComplete: boolean;
  requiresAction: boolean;
}

export interface AuthUser {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  departmentId?: number | null;
  positionId?: number;
  organizationId?: number;
  role: UserRole;
  department?: any;
  position?: any;
  permissions?: string[];
}

export enum UserRole {
  ADMIN = "Admin",
  MANAGER = "Manager",
  EMPLOYEE = "Employee",
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  departmentId: number;
  positionId: number;
  organizationId: number;
  role?: UserRole;
}

export interface AuthResponse {
  user: AuthUser;
  token: string;
  expiresIn: string;
}
