import express from "express";
import { VoteBookController } from "../controllers/VoteBookController";
import { authenticate, requirePermission } from "../middleware/auth";

const router = express.Router();

// Get vote book accounts (tree structure)
router.get("/", authenticate, VoteBookController.getAccounts);

// Get single vote book account
router.get("/:id", authenticate, VoteBookController.getAccount);

// Get detailed account information with all ledgers
router.get("/:id/detail", authenticate, VoteBookController.getAccountDetail);

// Create vote book account
router.post(
  "/",
  authenticate,
  requirePermission("manage_votebook"),
  VoteBookController.createAccount
);

// Update vote book account
router.patch(
  "/:id",
  authenticate,
  requirePermission("manage_votebook"),
  VoteBookController.updateAccount
);

// Freeze/unfreeze account
router.post(
  "/:id/freeze",
  authenticate,
  requirePermission("manage_votebook"),
  VoteBookController.freezeAccount
);

// Get account balance history (placeholder for future implementation)
router.get("/:id/history", authenticate, VoteBookController.getAccountHistory);

export default router;
