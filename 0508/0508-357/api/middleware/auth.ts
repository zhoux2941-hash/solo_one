import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'booking-system-secret-key';

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    role: string;
    phone: string;
    name: string;
  };
}

export function authMiddleware(requiredRole?: string) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供认证令牌',
      });
    }

    const token = authHeader.slice(7);

    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: number;
        role: string;
        phone: string;
        name: string;
      };

      if (requiredRole && decoded.role !== requiredRole) {
        return res.status(403).json({
          success: false,
          message: '权限不足',
        });
      }

      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: '认证令牌无效或已过期',
      });
    }
  };
}
