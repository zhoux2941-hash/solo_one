import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';
import type { FacePattern, ApiResponse, Shape, SichuanOpera } from '../../shared/types.js';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const { characterId } = req.query;
    
    if (!characterId) {
      return res.status(400).json({
        success: false,
        data: null,
        message: '缺少characterId参数'
      } as ApiResponse<FacePattern | null>);
    }

    const db = getDb();
    const stmt = db.prepare(`
      SELECT 
        id, character_id, pattern_type, main_color, secondary_color,
        outline_color, accent_color_1, accent_color_2, pattern_features,
        pattern_shapes, reference_image
      FROM face_patterns 
      WHERE character_id = ?
    `);
    const row = stmt.get([characterId]) as {
      id: number;
      character_id: number;
      pattern_type: 'symmetric' | 'asymmetric';
      main_color: string;
      secondary_color: string;
      outline_color: string;
      accent_color_1: string;
      accent_color_2: string;
      pattern_features: string;
      pattern_shapes: string;
      reference_image: string | null;
    } | undefined;

    if (!row) {
      return res.status(404).json({
        success: false,
        data: null,
        message: '未找到该人物的脸谱数据'
      } as ApiResponse<FacePattern | null>);
    }

    const operaRows = db.exec(`
      SELECT 
        so.id, so.name, so.alias, so.description, so.plot_summary,
        so.historical_background, so.cultural_significance,
        cor.role_description
      FROM sichuan_operas so
      INNER JOIN character_opera_relations cor ON so.id = cor.opera_id
      WHERE cor.character_id = ${characterId}
      ORDER BY so.id
    `);

    const relatedOperas: SichuanOpera[] = [];
    if (operaRows.length > 0) {
      operaRows[0].values.forEach((values) => {
        relatedOperas.push({
          id: values[0] as number,
          name: values[1] as string,
          alias: values[2] as string | undefined,
          description: values[3] as string,
          plotSummary: values[4] as string,
          historicalBackground: values[5] as string | undefined,
          culturalSignificance: values[6] as string | undefined,
        });
      });
    }

    const facePattern: FacePattern = {
      id: row.id,
      characterId: row.character_id,
      patternType: row.pattern_type,
      mainColor: row.main_color,
      secondaryColor: row.secondary_color,
      outlineColor: row.outline_color,
      accentColor1: row.accent_color_1,
      accentColor2: row.accent_color_2,
      patternFeatures: row.pattern_features,
      patternShapes: JSON.parse(row.pattern_shapes) as Shape[],
      referenceImage: row.reference_image,
      relatedOperas
    };

    res.json({ success: true, data: facePattern } as ApiResponse<FacePattern>);
  } catch (error) {
    console.error('Error fetching face pattern:', error);
    res.status(500).json({
      success: false,
      data: null,
      message: '获取脸谱详情失败'
    } as ApiResponse<FacePattern | null>);
  }
});

export default router;
