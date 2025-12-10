import express from "express";
import { authenticate, requirePermission } from "../middleware/auth";
import { VoucherController } from "../controllers/VoucherController";

const router = express.Router();

// Get all vouchers (with filters)
router.get("/", authenticate, VoucherController.getVouchers);

// Get single voucher
router.get("/:id", authenticate, VoucherController.getVoucher);

router.post(
  "/get-by-entity-ids",
  authenticate,
  VoucherController.getVoucherByEntityIds
);

// Create voucher
router.post(
  "/",
  authenticate,
  requirePermission("create_voucher"),
  VoucherController.createVoucher
);

// Submit voucher for approval
router.post("/:id/submit", authenticate, VoucherController.submitVoucher);

// Simulate voucher impact
router.post(
  "/:id/simulate",
  authenticate,
  VoucherController.simulateVoucherImpact
);

// Approve voucher
router.post("/:id/approve", authenticate, VoucherController.approveVoucher);

// Reject voucher
router.post("/:id/reject", authenticate, VoucherController.rejectVoucher);

export default router;
