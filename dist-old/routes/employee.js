"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const EmployeeController_1 = require("../controllers/EmployeeController");
const auth_1 = require("../middleware/auth");
const types_1 = require("../types");
const router = (0, express_1.Router)();
router.post("/employees", auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN, types_1.UserRole.MANAGER), EmployeeController_1.EmployeeController.create);
router.post("/employees/get-employees", auth_1.authenticate, EmployeeController_1.EmployeeController.getEmployees);
router.get("/employee", auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN, types_1.UserRole.MANAGER), EmployeeController_1.EmployeeController.getAll);
router.get("/employee/:id", auth_1.authenticate, (0, auth_1.ownerOrAdmin)("id"), EmployeeController_1.EmployeeController.getById);
router.put("/employee/:id", auth_1.authenticate, (0, auth_1.ownerOrAdmin)("id"), EmployeeController_1.EmployeeController.update);
router.delete("/employee/:id", auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN), EmployeeController_1.EmployeeController.delete);
exports.default = router;
//# sourceMappingURL=employee.js.map