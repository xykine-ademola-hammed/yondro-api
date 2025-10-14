import express from "express";
import { authenticate, requirePermission } from "../middleware/auth";
import { PdfController } from "../controllers/PdfController";

const router = express.Router();

// Generate PDF report
router.post(
  "/generate",
  authenticate,
  requirePermission("export_data"),
  PdfController.generatePdf
);

// Get available entities for PDF generation
router.get(
  "/entities",
  authenticate,
  requirePermission("export_data"),
  PdfController.getAvailableEntities
);

export default router;
