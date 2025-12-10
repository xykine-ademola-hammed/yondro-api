import express from "express";
import { authenticate } from "../middleware/auth";
import { PaymentController } from "../controllers/PaymentController";

const router = express.Router();

router.post("/filter", authenticate, PaymentController.getByFilter);
router.post("/", authenticate, PaymentController.create);

export default router;
