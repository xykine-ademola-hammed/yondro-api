import { Router } from "express";
import { WorkflowExecutionController } from "../controllers/WorkflowExecutionController";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "../types";
import multer from "multer";

const router = Router();

const upload = multer({ storage: multer.memoryStorage() });

// Workflow execution endpoints
router.post(
  "/workflow-request",
  authenticate,
  upload.any(),
  WorkflowExecutionController.startWorkflowRequest
);
router.post(
  "/workflowrequest/get-workflow-requests",
  authenticate,
  WorkflowExecutionController.getWorkflowRequests
);

router.post(
  "/workflowrequest/get-workflow-request-tasks",
  authenticate,
  WorkflowExecutionController.getWorkflowRequestTasks
);

router.post(
  "/workflowrequest/get-workflow-request-for-processing",
  authenticate,
  WorkflowExecutionController.getWorkflowRequestForProcessing
);

router.post(
  "/workflowrequest/get-request-history",
  authenticate,
  WorkflowExecutionController.getRequestHistory
);
router.get(
  "/workflowrequest/next-stage/:requestId",
  authenticate,
  WorkflowExecutionController.getNextStage
);
router.post(
  "/workflowrequest/stage/complete",
  authenticate,
  upload.any(),
  WorkflowExecutionController.completeStage
);
router.post(
  "/stage/internal/send-back",
  authenticate,
  WorkflowExecutionController.sendBackInternalStage
);

export default router;
