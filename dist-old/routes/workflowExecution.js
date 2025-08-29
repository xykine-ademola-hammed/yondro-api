"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const WorkflowExecutionController_1 = require("../controllers/WorkflowExecutionController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post("/workflow-request", auth_1.authenticate, WorkflowExecutionController_1.WorkflowExecutionController.startWorkflowRequest);
router.post("/workflowrequest/get-workflow-requests", auth_1.authenticate, WorkflowExecutionController_1.WorkflowExecutionController.getWorkflowRequests);
router.post("/workflowrequest/get-workflow-request-tasks", auth_1.authenticate, WorkflowExecutionController_1.WorkflowExecutionController.getWorkflowRequestTasks);
router.post("/workflowrequest/get-workflow-request-for-processing", auth_1.authenticate, WorkflowExecutionController_1.WorkflowExecutionController.getWorkflowRequestForProcessing);
router.post("/workflowrequest/get-request-history", auth_1.authenticate, WorkflowExecutionController_1.WorkflowExecutionController.getRequestHistory);
router.get("/workflowrequest/next-stage/:requestId", auth_1.authenticate, WorkflowExecutionController_1.WorkflowExecutionController.getNextStage);
router.post("/workflowrequest/stage/complete", auth_1.authenticate, WorkflowExecutionController_1.WorkflowExecutionController.completeStage);
router.post("/stage/internal/send-back", auth_1.authenticate, WorkflowExecutionController_1.WorkflowExecutionController.sendBackInternalStage);
exports.default = router;
//# sourceMappingURL=workflowExecution.js.map