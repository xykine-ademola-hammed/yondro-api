"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const SchoolOfficeController_1 = require("../controllers/SchoolOfficeController");
const auth_1 = require("../middleware/auth");
const types_1 = require("../types");
const router = (0, express_1.Router)();
router.post("/school-office", SchoolOfficeController_1.SchoolOrOfficeController.create);
router.post("/school-office/get-schoolOffices", auth_1.authenticate, SchoolOfficeController_1.SchoolOrOfficeController.getSchoolOrOffices);
router.get("/school-office", auth_1.authenticate, SchoolOfficeController_1.SchoolOrOfficeController.getAll);
router.get("/school-office/:id", auth_1.authenticate, SchoolOfficeController_1.SchoolOrOfficeController.getById);
router.put("/school-office/:id", auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN, types_1.UserRole.MANAGER), SchoolOfficeController_1.SchoolOrOfficeController.update);
router.delete("/school-office/:id", auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN), SchoolOfficeController_1.SchoolOrOfficeController.delete);
exports.default = router;
//# sourceMappingURL=schooOrOffice.js.map