"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.departmentAccess = exports.ownerOrAdmin = exports.optionalAuth = exports.authorize = exports.authenticate = void 0;
const AuthService_1 = require("../services/AuthService");
const types_1 = require("../types");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                success: false,
                error: 'Access token required'
            });
            return;
        }
        const token = authHeader.substring(7);
        const user = await AuthService_1.AuthService.verifyToken(token);
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            error: error.message || 'Invalid token'
        });
    }
};
exports.authenticate = authenticate;
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
            return;
        }
        if (!allowedRoles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                error: 'Insufficient permissions'
            });
            return;
        }
        next();
    };
};
exports.authorize = authorize;
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const user = await AuthService_1.AuthService.verifyToken(token);
            req.user = user;
        }
        next();
    }
    catch (error) {
        next();
    }
};
exports.optionalAuth = optionalAuth;
const ownerOrAdmin = (userIdField = 'userId') => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
            return;
        }
        const resourceUserId = req.params[userIdField] || req.body[userIdField];
        if (req.user.role === types_1.UserRole.ADMIN || req.user.id === Number(resourceUserId)) {
            next();
            return;
        }
        res.status(403).json({
            success: false,
            error: 'Access denied'
        });
    };
};
exports.ownerOrAdmin = ownerOrAdmin;
const departmentAccess = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({
            success: false,
            error: 'Authentication required'
        });
        return;
    }
    if (req.user.role === types_1.UserRole.ADMIN) {
        next();
        return;
    }
    const departmentId = req.params.departmentId || req.body.departmentId;
    if (req.user.departmentId === Number(departmentId)) {
        next();
        return;
    }
    res.status(403).json({
        success: false,
        error: 'Department access denied'
    });
};
exports.departmentAccess = departmentAccess;
//# sourceMappingURL=auth.js.map