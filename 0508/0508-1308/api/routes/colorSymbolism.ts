import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';
import type { ColorSymbolism, ApiResponse } from '../../shared/types.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const db = getDb();
    const rows = db.exec('SELECT id, color, hex, meaning, examples FROM color_symbolism ORDER BY id');
    
    if (rows.length === 0) {
      return res.json({ success: true, data: [] } as ApiResponse<ColorSymbolism[]>);
    }

    const colorSymbolism: ColorSymbolism[] = rows[0].values.map((row) => ({
      id: row[0] as number,
      color: row[1] as string,
      hex: row[2] as string,
      meaning: row[3] as string,
      examples: row[4] as string
    }));

    res.json({ success: true, data: colorSymbolism } as ApiResponse<ColorSymbolism[]>);
  } catch (error) {
    console.error('Error fetching color symbolism:', error);
    res.status(500).json({
      success: false,
      data: [],
      message: '获取颜色象征意义失败'
    } as ApiResponse<ColorSymbolism[]>);
  }
});

export default router;
