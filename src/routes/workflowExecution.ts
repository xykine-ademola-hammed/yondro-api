import { Router } from "express";
import { WorkflowExecutionController } from "../controllers/WorkflowExecutionController";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "../types";

const router = Router();

// Workflow execution endpoints
router.post(
  "/workflow-request",
  authenticate,
  WorkflowExecutionController.startWorkflowRequest
);
router.post(
  "/workflowrequest/get-workflow-requests",
  authenticate,
  WorkflowExecutionController.getWorkflowRequests
);
router.get(
  "/workflowrequest/next-stage/:requestId",
  authenticate,
  WorkflowExecutionController.getNextStage
);
router.post(
  "/workflowrequest/stage/complete",
  authenticate,
  WorkflowExecutionController.completeStage
);
router.post(
  "/stage/internal/send-back",
  authenticate,
  WorkflowExecutionController.sendBackInternalStage
);

export default router;
