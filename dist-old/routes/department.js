"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const DepartmentController_1 = require("../controllers/DepartmentController");
const auth_1 = require("../middleware/auth");
const types_1 = require("../types");
const router = (0, express_1.Router)();
router.post("/departments", DepartmentController_1.DepartmentController.create);
router.post("/departments/get-depts", auth_1.authenticate, DepartmentController_1.DepartmentController.getDepartments);
router.get("/departments", auth_1.authenticate, DepartmentController_1.DepartmentController.getAll);
router.get("/departments/:id", auth_1.authenticate, DepartmentController_1.DepartmentController.getById);
router.put("/departments/:id", auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN, types_1.UserRole.MANAGER), DepartmentController_1.DepartmentController.update);
router.delete("/departments/:id", auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN), DepartmentController_1.DepartmentController.delete);
exports.default = router;
//# sourceMappingURL=department.js.map