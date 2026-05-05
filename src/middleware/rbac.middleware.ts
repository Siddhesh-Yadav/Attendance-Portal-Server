import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../errors';
import { logger } from '../config/logger';

/**
 * RBAC middleware factory — checks if the authenticated user has at least one of the required permissions.
 */
export function requirePermission(requiredPerms: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        errorCode: 'AUTH_REQUIRED',
      });
      return;
    }

    const hasPermission = requiredPerms.some((perm) => req.user!.permissions.includes(perm));

    if (!hasPermission) {
      logger.warn('Permission denied', {
        userId: req.user.id,
        role: req.user.role,
        required: requiredPerms,
        granted: req.user.permissions,
        path: req.path,
        method: req.method,
      });

      res.status(403).json({
        success: false,
        message: 'Insufficient permissions',
        errorCode: 'FORBIDDEN',
        details: {
          required: requiredPerms,
          granted: req.user.permissions,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Role-based middleware — checks if user has one of the allowed roles.
 */
export function requireRole(allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentication required',
        errorCode: 'AUTH_REQUIRED',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      logger.warn('Role denied', {
        userId: req.user.id,
        role: req.user.role,
        required: allowedRoles,
        path: req.path,
      });

      res.status(403).json({
        success: false,
        message: 'Insufficient role',
        errorCode: 'FORBIDDEN',
      });
      return;
    }

    next();
  };
}
