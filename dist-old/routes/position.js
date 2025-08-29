"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const PositionController_1 = require("../controllers/PositionController");
const auth_1 = require("../middleware/auth");
const types_1 = require("../types");
const router = (0, express_1.Router)();
router.post("/positions", PositionController_1.PositionController.create);
router.post("/positions/get-positions", auth_1.authenticate, PositionController_1.PositionController.getPositions);
router.get("/positions", auth_1.authenticate, PositionController_1.PositionController.getAll);
router.get("/positions/:id", auth_1.authenticate, PositionController_1.PositionController.getById);
router.put("/positions/:id", auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN, types_1.UserRole.MANAGER), PositionController_1.PositionController.update);
router.delete("/positions/:id", auth_1.authenticate, (0, auth_1.authorize)(types_1.UserRole.ADMIN), PositionController_1.PositionController.delete);
exports.default = router;
//# sourceMappingURL=position.js.map