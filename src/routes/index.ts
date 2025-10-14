import { Router } from "express";
import workflowExecutionRoutes from "./workflowExecution";
import workflowRoutes from "./workflow";
import organizationRoutes from "./organization";
import departmentRoutes from "./department";
import schoolOrOffices from "./schooOrOffice";
import positionRoutes from "./position";
import employeeRoutes from "./employee";
import authRoutes from "./auth";
import ncoaRoutes from "./ncoa";
import votebooksRoutes from "./votebooks";
import vouchersRoutes from "./vouchers";
import budgetAdjustmentsRoutes from "./budget-adjustments";
import fiscalYearRoutes from "./fiscal-year";
import pdfRoutes from "./pdf";

const router = Router();

// Mount all routes
router.use("/api", authRoutes);
router.use("/api", workflowExecutionRoutes);
router.use("/api", workflowRoutes);
router.use("/api", schoolOrOffices);
router.use("/api", organizationRoutes);
router.use("/api", departmentRoutes);
router.use("/api", positionRoutes);
router.use("/api", employeeRoutes);
router.use("/api/ncoa", ncoaRoutes);
router.use("/api/votebooks", votebooksRoutes);
router.use("/api/vouchers", vouchersRoutes);
router.use("/api/budget-adjustments", budgetAdjustmentsRoutes);
router.use("/api/fiscal-years", fiscalYearRoutes);
router.use("/api/pdf", pdfRoutes);

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "Workflow Management Backend",
  });
});

export default router;
