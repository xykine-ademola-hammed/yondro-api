import { Router } from "express";
import { EmployeeController } from "../controllers/EmployeeController";
import { authenticate, authorize, ownerOrAdmin } from "../middleware/auth";
import { UserRole } from "../types";

const router = Router();

// Employee CRUD endpoints
router.post(
  "/employees",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  EmployeeController.create
);
router.post(
  "/employees/get-employees",
  authenticate,
  EmployeeController.getEmployees
);
router.get(
  "/employee",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  EmployeeController.getAll
);

router.post(
  "/employees/lookup",
  authenticate,
  EmployeeController.lookupEmployees
);

router.get(
  "/employee/:id",
  authenticate,
  ownerOrAdmin("id"),
  EmployeeController.getById
);
router.put(
  "/employee/:id",
  authenticate,
  ownerOrAdmin("id"),
  EmployeeController.update
);
router.delete(
  "/employee/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  EmployeeController.delete
);

export default router;
