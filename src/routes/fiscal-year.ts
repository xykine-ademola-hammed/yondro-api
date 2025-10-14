import express from "express";
import { authenticate, requirePermission } from "../middleware/auth";
import { FiscalYearController } from "../controllers/FiscalYearController";

const router = express.Router();

// Get all fiscal years with filtering
router.get("/", authenticate, FiscalYearController.getFiscalYears);

// Get single fiscal year
router.get("/:id", authenticate, FiscalYearController.getFiscalYear);

// Create fiscal year
router.post(
  "/",
  authenticate,
  requirePermission("manage_fiscal_years"),
  FiscalYearController.createFiscalYear
);

// Update fiscal year
router.patch(
  "/:id",
  authenticate,
  requirePermission("manage_fiscal_years"),
  FiscalYearController.updateFiscalYear
);

// Close fiscal year
router.post(
  "/:id/close",
  authenticate,
  requirePermission("close_fiscal_year"),
  FiscalYearController.closeFiscalYear
);

// Set current fiscal year
router.post(
  "/:id/set-current",
  authenticate,
  requirePermission("manage_fiscal_years"),
  FiscalYearController.setCurrentFiscalYear
);

export default router;
