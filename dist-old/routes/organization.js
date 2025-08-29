"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const OrganizationController_1 = require("../controllers/OrganizationController");
const auth_1 = require("../middleware/auth");
const types_1 = require("../types");
const router = (0, express_1.Router)();
router.post("/organizations", OrganizationController_1.OrganizationController.create);
router.get("/organizations", auth_1.authenticate, OrganizationController_1.OrganizationController.getAll);
router.get("/organizations/:id", auth_1.authenticate, OrganizationController_1.OrganizationController.getById);
router.put("/organizations/:id", auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN), OrganizationController_1.OrganizationController.update);
router.delete("/organizations/:id", auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN), OrganizationController_1.OrganizationController.delete);
exports.default = router;
//# sourceMappingURL=organization.js.map