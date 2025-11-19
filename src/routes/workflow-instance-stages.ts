import { Router } from "express";
import { WorkflowInstanceStageController } from "../controllers/WorkflowInstanceStageController";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post(
  "/workflow-instance-stages/mine",
  authenticate,
  WorkflowInstanceStageController.getWorkflowInstanceStages
);

export default router;
