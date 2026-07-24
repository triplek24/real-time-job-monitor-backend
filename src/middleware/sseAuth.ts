import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/jwt';

export const authenticateSSE = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.query.token as string;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Token required in query parameter: ?token=YOUR_JWT',
      });
    }

    const decoded = verifyToken(token);

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role as 'ADMIN' | 'OPERATOR' | 'VIEWER',
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
};