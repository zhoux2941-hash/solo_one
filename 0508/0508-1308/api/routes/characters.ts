import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';
import type { Character, ApiResponse } from '../../shared/types.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const { roleId } = req.query;
    
    if (!roleId) {
      return res.status(400).json({
        success: false,
        data: [],
        message: '缺少roleId参数'
      } as ApiResponse<Character[]>);
    }

    const db = getDb();
    const stmt = db.prepare(
      'SELECT id, role_id, name, alias, description FROM characters WHERE role_id = ? ORDER BY id'
    );
    const rows = stmt.all([roleId]) as Array<{
      id: number;
      role_id: number;
      name: string;
      alias: string;
      description: string;
    }>;

    const characters: Character[] = rows.map((row) => ({
      id: row.id,
      roleId: row.role_id,
      name: row.name,
      alias: row.alias,
      description: row.description
    }));

    res.json({ success: true, data: characters } as ApiResponse<Character[]>);
  } catch (error) {
    console.error('Error fetching characters:', error);
    res.status(500).json({
      success: false,
      data: [],
      message: '获取人物列表失败'
    } as ApiResponse<Character[]>);
  }
});

export default router;
