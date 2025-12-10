import express from "express";
import { authenticate } from "../middleware/auth";
import { MessageController } from "../controllers/MessageController";

const router = express.Router();

router.post("/by-entity-id", authenticate, MessageController.getByEntityId);
router.post("/", authenticate, MessageController.create);
router.put("/message/:id", authenticate, MessageController.edit);
router.delete("/message/:id", authenticate, MessageController.delete);

export default router;
