import { Router } from "express";
import { DepartmentController } from "../controllers/DepartmentController";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "../types";

const router = Router();

// Department CRUD endpoints
router.post(
  "/departments",
  // authenticate,
  // authorize(UserRole.ADMIN, UserRole.MANAGER),
  DepartmentController.create
);
router.post(
  "/departments/get-depts",
  authenticate,
  DepartmentController.getDepartments
);
router.get("/departments", authenticate, DepartmentController.getAll);
router.get("/departments/:id", authenticate, DepartmentController.getById);
router.put(
  "/departments/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  DepartmentController.update
);
router.delete(
  "/departments/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  DepartmentController.delete
);

export default router;
