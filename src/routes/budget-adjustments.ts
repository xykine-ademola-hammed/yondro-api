import express from "express";
import { authenticate, requirePermission } from "../middleware/auth";
import { BudgetAdjustmentController } from "../controllers/BudgetAdjustmentController";

const router = express.Router();

// Get all budget adjustments
router.get("/", authenticate, BudgetAdjustmentController.getAdjustments);

// Get single budget adjustment
router.get("/:id", authenticate, BudgetAdjustmentController.getAdjustment);

// Create budget adjustment
router.post(
  "/",
  authenticate,
  requirePermission("manage_budget"),
  BudgetAdjustmentController.createAdjustment
);

// Approve budget adjustment
router.post(
  "/:id/approve",
  authenticate,
  requirePermission("approve_budget"),
  BudgetAdjustmentController.approveAdjustment
);

// Post budget adjustment (execute the fund movement)
router.post(
  "/:id/post",
  authenticate,
  requirePermission("post_budget"),
  BudgetAdjustmentController.postAdjustment
);

// Reject budget adjustment
router.post(
  "/:id/reject",
  authenticate,
  requirePermission("approve_budget"),
  BudgetAdjustmentController.rejectAdjustment
);

// Simulate budget adjustment impact
router.post(
  "/:id/simulate",
  authenticate,
  BudgetAdjustmentController.simulateAdjustment
);

export default router;
