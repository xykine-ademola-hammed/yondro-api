import { Router } from "express";
import { PositionController } from "../controllers/PositionController";
import { authenticate, authorize } from "../middleware/auth";
import { UserRole } from "../types";

const router = Router();

// Position CRUD endpoints
router.post(
  "/positions",
  //   authenticate,
  //   authorize(UserRole.ADMIN, UserRole.MANAGER),
  PositionController.create
);
router.post(
  "/positions/get-positions",
  authenticate,
  PositionController.getPositions
);
router.get("/positions", authenticate, PositionController.getAll);
router.get("/positions/:id", authenticate, PositionController.getById);
router.put(
  "/positions/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.MANAGER),
  PositionController.update
);
router.delete(
  "/positions/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  PositionController.delete
);

export default router;
