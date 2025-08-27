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
}

export enum InternalStageRole {
  INITIATOR = "Initiator",
  REVIEWER = "Reviewer",
  APPROVER = "Approver",
}

export interface StageCompletionData {
  stageId: number;
  action: "Approve" | "Reject";
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
  departmentId: number;
  positionId: number;
  role: UserRole;
  department: any;
  position: any;
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
