"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const WorkflowController_1 = require("../controllers/WorkflowController");
const auth_1 = require("../middleware/auth");
const types_1 = require("../types");
const router = (0, express_1.Router)();
router.post("/workflows", auth_1.authenticate, WorkflowController_1.WorkflowController.createWorkflow);
router.post("/workflows/get-workflows", auth_1.authenticate, WorkflowController_1.WorkflowController.getWorkflows);
router.get("/workflows/:id", auth_1.authenticate, WorkflowController_1.WorkflowController.getWorkflow);
router.put("/workflow/:id", auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN, types_1.UserRole.MANAGER), WorkflowController_1.WorkflowController.updateWorkflow);
router.delete("/workflow/:id", auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN), WorkflowController_1.WorkflowController.deleteWorkflow);
router.post("/workflow/:id/stage", auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN, types_1.UserRole.MANAGER), WorkflowController_1.WorkflowController.addStageToWorkflow);
exports.default = router;
//# sourceMappingURL=workflow.js.map