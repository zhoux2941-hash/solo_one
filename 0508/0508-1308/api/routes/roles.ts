import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';
import type { Role, ApiResponse } from '../../shared/types.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const rows = db.exec('SELECT id, name, description, icon FROM roles ORDER BY id');
    
    if (rows.length === 0) {
      return res.json({ success: true, data: [] } as ApiResponse<Role[]>);
    }

    const roles: Role[] = rows[0].values.map((row) => ({
      id: row[0] as number,
      name: row[1] as string,
      description: row[2] as string,
      icon: row[3] as string
    }));

    res.json({ success: true, data: roles } as ApiResponse<Role[]>);
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({ 
      success: false, 
      data: [], 
      message: '获取角色列表失败' 
    } as ApiResponse<Role[]>);
  }
});

export default router;
