"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = exports.InternalStageRole = exports.WorkflowInstanceStageStatus = exports.WorkflowRequestStatus = void 0;
var WorkflowRequestStatus;
(function (WorkflowRequestStatus) {
    WorkflowRequestStatus["PENDING"] = "Pending";
    WorkflowRequestStatus["APPROVED"] = "Approved";
    WorkflowRequestStatus["REJECTED"] = "Rejected";
})(WorkflowRequestStatus || (exports.WorkflowRequestStatus = WorkflowRequestStatus = {}));
var WorkflowInstanceStageStatus;
(function (WorkflowInstanceStageStatus) {
    WorkflowInstanceStageStatus["PENDING"] = "Pending";
    WorkflowInstanceStageStatus["APPROVED"] = "Approved";
    WorkflowInstanceStageStatus["REJECTED"] = "Rejected";
    WorkflowInstanceStageStatus["CREATED"] = "Created";
    WorkflowInstanceStageStatus["SUBMITTED"] = "Submitted";
})(WorkflowInstanceStageStatus || (exports.WorkflowInstanceStageStatus = WorkflowInstanceStageStatus = {}));
var InternalStageRole;
(function (InternalStageRole) {
    InternalStageRole["INITIATOR"] = "Initiator";
    InternalStageRole["REVIEWER"] = "Reviewer";
    InternalStageRole["APPROVER"] = "Approver";
})(InternalStageRole || (exports.InternalStageRole = InternalStageRole = {}));
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "Admin";
    UserRole["MANAGER"] = "Manager";
    UserRole["EMPLOYEE"] = "Employee";
})(UserRole || (exports.UserRole = UserRole = {}));
//# sourceMappingURL=index.js.map