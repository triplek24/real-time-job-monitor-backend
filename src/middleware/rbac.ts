
import { Request, Response, NextFunction } from 'express';

export const requireRole = (...allowedRoles: Array<'ADMIN' | 'OPERATOR' | 'VIEWER'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: `Your role (${req.user.role}) does not have permission for this action. Required: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};