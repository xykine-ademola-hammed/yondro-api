import { Router } from "express";
import { SchoolOrOfficeController } from "../controllers/SchoolOfficeController";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "../types";

const router = Router();

// SchoolOrOffice CRUD endpoints
router.post(
  "/school-office",
  // authenticate,
  // authorize(UserRole.ADMIN, UserRole.MANAGER),
  SchoolOrOfficeController.create
);
router.post(
  "/school-office/get-schoolOffices",
  authenticate,
  SchoolOrOfficeController.getSchoolOrOffices
);
router.get("/school-office", authenticate, SchoolOrOfficeController.getAll);
router.get(
  "/school-office/:id",
  authenticate,
  SchoolOrOfficeController.getById
);
router.put(
  "/school-office/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  SchoolOrOfficeController.update
);
router.delete(
  "/school-office/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  SchoolOrOfficeController.delete
);

export default router;
