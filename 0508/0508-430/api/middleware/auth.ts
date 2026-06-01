import { Request, Response, NextFunction } from 'express';
import AdminUserRepository from '../repositories/AdminUserRepository.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'knowledge-base-secret-key-2026';

declare global {
  namespace Express {
    interface Request {
      adminUser?: { username: string };
    }
  }
}

export function extractDepartment(req: Request, _res: Response, next: NextFunction): void {
  const department = req.headers['x-user-department'] as string || '未知部门';
  req.headers['x-user-department'] = department;
  next();
}

export function generateToken(username: string): string {
  return jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
}

export function verifyToken(token: string): { username: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { username: string };
  } catch {
    return null;
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '未授权访问' });
    return;
  }
  
  const token = authHeader.slice(7);
  const payload = verifyToken(token);
  
  if (!payload) {
    res.status(401).json({ error: 'Token无效或已过期' });
    return;
  }
  
  req.adminUser = { username: payload.username };
  next();
}

export async function loginAdmin(username: string, password: string): Promise<{ success: boolean; token?: string; error?: string }> {
  const isValid = AdminUserRepository.verifyPassword(username, password);
  if (!isValid) {
    return { success: false, error: '用户名或密码错误' };
  }
  
  const token = generateToken(username);
  return { success: true, token };
}
