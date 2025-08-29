"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const workflowExecution_1 = __importDefault(require("./workflowExecution"));
const workflow_1 = __importDefault(require("./workflow"));
const organization_1 = __importDefault(require("./organization"));
const department_1 = __importDefault(require("./department"));
const schooOrOffice_1 = __importDefault(require("./schooOrOffice"));
const position_1 = __importDefault(require("./position"));
const employee_1 = __importDefault(require("./employee"));
const auth_1 = __importDefault(require("./auth"));
const router = (0, express_1.Router)();
router.use("/api", auth_1.default);
router.use("/api", workflowExecution_1.default);
router.use("/api", workflow_1.default);
router.use("/api", schooOrOffice_1.default);
router.use("/api", organization_1.default);
router.use("/api", department_1.default);
router.use("/api", position_1.default);
router.use("/api", employee_1.default);
router.get("/health", (req, res) => {
    res.json({
        status: "OK",
        timestamp: new Date().toISOString(),
        service: "Workflow Management Backend",
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map