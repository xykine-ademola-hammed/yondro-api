import { Router } from "express";
import workflowExecutionRoutes from "./workflowExecution";
import workflowRoutes from "./workflow";
import organizationRoutes from "./organization";
import departmentRoutes from "./department";
import schoolOrOffices from "./schooOrOffice";
import positionRoutes from "./position";
import employeeRoutes from "./employee";
import authRoutes from "./auth";

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

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "Workflow Management Backend",
  });
});

export default router;
