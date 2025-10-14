import express from "express";
import { NcoaController } from "../controllers/NcoaController";
import { authenticate } from "../middleware/auth";

const router = express.Router();

// Get all NCOA codes with filtering
router.get("/", authenticate, NcoaController.getCodes);

// Get single NCOA code
router.get("/:code", authenticate, NcoaController.getCode);

// Get NCOA codes hierarchy (by level)
router.get("/hierarchy/:level", authenticate, NcoaController.getHierarchy);

// Get NCOA codes by economic type
router.get("/type/:economicType", authenticate, NcoaController.getByType);

// Get summary statistics
router.get("/stats/summary", authenticate, NcoaController.getStats);

export default router;
