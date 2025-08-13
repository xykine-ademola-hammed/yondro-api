import { Router } from "express";
import { WorkflowController } from "../controllers/WorkflowController";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "../types";

const router = Router();

// Workflow management endpoints
router.post(
  "/workflows",
  authenticate,
  //   authorize(UserRole.ADMIN, UserRole.MANAGER),
  WorkflowController.createWorkflow
);
router.post(
  "/workflows/get-workflows",
  authenticate,
  WorkflowController.getWorkflows
);
router.get("/workflows/:id", authenticate, WorkflowController.getWorkflow);
router.put(
  "/workflow/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  WorkflowController.updateWorkflow
);
router.delete(
  "/workflow/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  WorkflowController.deleteWorkflow
);
router.post(
  "/workflow/:id/stage",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  WorkflowController.addStageToWorkflow
);

export default router;
