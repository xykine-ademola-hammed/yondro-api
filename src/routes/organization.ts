import { Router } from "express";
import { OrganizationController } from "../controllers/OrganizationController";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "../types";

const router = Router();

// Organization CRUD endpoints
router.post(
  "/organizations",
  // authenticate, authorize(UserRole.ADMIN),
  OrganizationController.create
);
router.get("/organizations", authenticate, OrganizationController.getAll);
router.get("/organizations/:id", authenticate, OrganizationController.getById);
router.put(
  "/organizations/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  OrganizationController.update
);
router.delete(
  "/organizations/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  OrganizationController.delete
);

export default router;
