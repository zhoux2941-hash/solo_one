import { Request, Response } from 'express';
import * as colorService from '../services/color.service';
import type { RGB, CMYK, Lab } from '../../shared/types';

function success(res: Response, data: any) {
  res.json({ success: true, data });
}

function error(res: Response, message: string, status: number = 400) {
  res.status(status).json({ success: false, error: message });
}

export function convertRgbToAll(req: Request, res: Response) {
  try {
    const { rgb } = req.body;
    if (!rgb || !colorService.validateRgb(rgb)) {
      return error(res, '无效的 RGB 值，请提供 0-255 范围内的整数');
    }
    const result = colorService.convertRgbToAll(rgb);
    success(res, result);
  } catch (e) {
    error(res, '转换失败: ' + (e as Error).message, 500);
  }
}

export function convertCmykToAll(req: Request, res: Response) {
  try {
    const { cmyk } = req.body;
    if (!cmyk || !colorService.validateCmyk(cmyk)) {
      return error(res, '无效的 CMYK 值，请提供 0-100 范围内的数值');
    }
    const result = colorService.convertCmykToAll(cmyk);
    success(res, result);
  } catch (e) {
    error(res, '转换失败: ' + (e as Error).message, 500);
  }
}

export function convertPantoneToAll(req: Request, res: Response) {
  try {
    const { code } = req.body;
    if (!code || typeof code !== 'string') {
      return error(res, '请提供 Pantone 色号');
    }
    const result = colorService.convertPantoneToAll(code.toUpperCase());
    if (!result) {
      return error(res, '未找到该 Pantone 色号', 404);
    }
    success(res, result);
  } catch (e) {
    error(res, '转换失败: ' + (e as Error).message, 500);
  }
}

export function convertHexToAll(req: Request, res: Response) {
  try {
    const { hex } = req.body;
    if (!hex || !colorService.validateHex(hex)) {
      return error(res, '无效的 HEX 值');
    }
    const result = colorService.convertHexToAll(hex);
    success(res, result);
  } catch (e) {
    error(res, '转换失败: ' + (e as Error).message, 500);
  }
}

export function searchPantone(req: Request, res: Response) {
  try {
    const { q, limit } = req.query;
    const query = (q as string) || '';
    const limitNum = Math.min(parseInt(limit as string) || 50, 200);
    
    if (query.length < 1) {
      return error(res, '请输入搜索关键词');
    }
    
    const results = colorService.searchPantone(query, limitNum);
    success(res, { results, count: results.length });
  } catch (e) {
    error(res, '搜索失败: ' + (e as Error).message, 500);
  }
}

export function listPantone(req: Request, res: Response) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = Math.min(parseInt(req.query.pageSize as string) || 50, 200);
    const category = req.query.category as string;
    
    const result = colorService.listPantone(page, pageSize, category);
    success(res, {
      ...result,
      page,
      pageSize,
      totalPages: Math.ceil(result.total / pageSize)
    });
  } catch (e) {
    error(res, '查询失败: ' + (e as Error).message, 500);
  }
}

export function matchPantone(req: Request, res: Response) {
  try {
    const { rgb } = req.body;
    const limit = Math.min(parseInt(req.body.limit) || 5, 20);
    
    if (!rgb || !colorService.validateRgb(rgb)) {
      return error(res, '无效的 RGB 值');
    }
    
    const matches = colorService.matchPantoneByRgb(rgb, limit);
    success(res, { matches });
  } catch (e) {
    error(res, '匹配失败: ' + (e as Error).message, 500);
  }
}

export function calculateDeltaE(req: Request, res: Response) {
  try {
    const { lab1, lab2, rgb1, rgb2 } = req.body;
    
    let result;
    if (lab1 && lab2) {
      result = colorService.calculateDeltaE2000(lab1 as Lab, lab2 as Lab);
    } else if (rgb1 && rgb2) {
      result = colorService.calculateDeltaEByRgb(rgb1 as RGB, rgb2 as RGB);
    } else {
      return error(res, '请提供两组 Lab 或 RGB 值进行对比');
    }
    
    success(res, result);
  } catch (e) {
    error(res, '计算失败: ' + (e as Error).message, 500);
  }
}

export function getCategories(req: Request, res: Response) {
  try {
    const categories = colorService.getCategories();
    success(res, { categories });
  } catch (e) {
    error(res, '获取分类失败: ' + (e as Error).message, 500);
  }
}

export function getPresetColors(req: Request, res: Response) {
  try {
    const colors = colorService.getPresetColors();
    success(res, { colors });
  } catch (e) {
    error(res, '获取预置颜色失败: ' + (e as Error).message, 500);
  }
}

export function calculateOverprint(req: Request, res: Response) {
  try {
    const { color1, color2, opacity1, opacity2 } = req.body;
    
    if (!color1 || !color2) {
      return error(res, '请提供两个 Pantone 色号');
    }
    
    const result = colorService.calculateOverprint(
      color1,
      color2,
      opacity1 ?? 100,
      opacity2 ?? 100
    );
    
    if (!result) {
      return error(res, '未找到指定的 Pantone 色号', 404);
    }
    
    success(res, result);
  } catch (e) {
    error(res, '叠印计算失败: ' + (e as Error).message, 500);
  }
}

export function getReportData(req: Request, res: Response) {
  try {
    const { colorIds, title, application, notes } = req.body;
    
    if (!colorIds || !Array.isArray(colorIds) || colorIds.length === 0) {
      return error(res, '请选择要包含在报告中的颜色');
    }
    
    const colors = colorService.getColorsByIds(colorIds);
    
    if (colors.length === 0) {
      return error(res, '未找到选择的颜色', 404);
    }
    
    success(res, {
      colors,
      title: title || '颜色报告',
      application: application || '',
      notes: notes || '',
      generatedAt: new Date().toISOString()
    });
  } catch (e) {
    error(res, '生成报告数据失败: ' + (e as Error).message, 500);
  }
}
