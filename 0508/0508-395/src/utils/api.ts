import axios from 'axios';
import type {
  RGB, CMYK, Lab, ColorConversionResult, DeltaEResult, PantoneColor, OverprintResult, ColorReportData } from '@shared/types';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
});

export const colorApi = {
  async convertRgb(rgb: RGB): Promise<ColorConversionResult> {
    const res = await api.post('/convert/rgb-to-all', { rgb });
    return res.data.data;
  },

  async convertCmyk(cmyk: CMYK): Promise<ColorConversionResult> {
    const res = await api.post('/convert/cmyk-to-all', { cmyk });
    return res.data.data;
  },

  async convertPantone(code: string): Promise<ColorConversionResult> {
    const res = await api.post('/convert/pantone-to-all', { code });
    return res.data.data;
  },

  async convertHex(hex: string): Promise<ColorConversionResult> {
    const res = await api.post('/convert/hex-to-all', { hex });
    return res.data.data;
  },

  async searchPantone(query: string, limit: number = 50): Promise<{ results: PantoneColor[]; count: number }> {
    const res = await api.get('/pantone/search', { params: { q: query, limit } });
    return res.data.data;
  },

  async listPantone(page: number = 1, pageSize: number = 50, category?: string) {
    const res = await api.get('/pantone/list', { params: { page, pageSize, category } });
    return res.data.data;
  },

  async matchPantone(rgb: RGB, limit: number = 5): Promise<{ matches: PantoneColor[] }> {
    const res = await api.post('/pantone/match', { rgb, limit });
    return res.data.data;
  },

  async getCategories(): Promise<{ categories: string[] }> {
    const res = await api.get('/pantone/categories');
    return res.data.data;
  },

  async getPresets(): Promise<{ colors: PantoneColor[] }> {
    const res = await api.get('/pantone/presets');
    return res.data.data;
  },

  async calculateDeltaE(
    color1: Lab | RGB,
    color2: Lab | RGB,
    useRgb?: boolean
  ): Promise<DeltaEResult> {
    const body = useRgb
      ? { rgb1: color1, rgb2: color2 }
      : { lab1: color1, lab2: color2 };
    const res = await api.post('/delta-e/cie2000', body);
    return res.data.data;
  },

  async calculateOverprint(
    color1: string,
    color2: string,
    opacity1: number = 100,
    opacity2: number = 100
  ): Promise<OverprintResult> {
    const res = await api.post('/overprint/calculate', { color1, color2, opacity1, opacity2 });
    return res.data.data;
  },

  async getReportData(
    colorIds: number[],
    title?: string,
    application?: string,
    notes?: string
  ): Promise<ColorReportData> {
    const res = await api.post('/export/report-data', { colorIds, title, application, notes });
    return res.data.data;
  }
};

export default api;
