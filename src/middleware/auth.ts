import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { AuthUser, UserRole } from '../types';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Authentication middleware - verifies JWT token
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'Access token required'
      });
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const user = await AuthService.verifyToken(token);
    req.user = user;
    
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: error.message || 'Invalid token'
    });
  }
};

/**
 * Authorization middleware - checks user roles
 */
export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
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

/**
 * Optional authentication middleware - adds user to request if token is valid
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await AuthService.verifyToken(token);
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};

/**
 * Check if user owns resource or is admin
 */
export const ownerOrAdmin = (userIdField: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    const resourceUserId = req.params[userIdField] || req.body[userIdField];
    
    if (req.user.role === UserRole.ADMIN || req.user.id === Number(resourceUserId)) {
      next();
      return;
    }

    res.status(403).json({
      success: false,
      error: 'Access denied'
    });
  };
};

/**
 * Department-based authorization
 */
export const departmentAccess = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
    return;
  }

  // Admins have access to all departments
  if (req.user.role === UserRole.ADMIN) {
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