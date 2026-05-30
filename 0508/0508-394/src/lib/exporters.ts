import * as XLSX from 'xlsx';
import type { ComponentResult, Dynasty, ModuleData } from './types';
import { calculateSectionElements } from './calculator';

export function exportDXF(
  dynasty: Dynasty,
  jumps: number,
  mod: ModuleData
): void {
  const elements = calculateSectionElements(dynasty, jumps, mod);
  const scale = mod.fenMm;

  let dxf = '0\nSECTION\n2\nHEADER\n0\nENDSEC\n';
  dxf += '0\nSECTION\n2\nTABLES\n0\nENDSEC\n';
  dxf += '0\nSECTION\n2\nBLOCKS\n0\nENDSEC\n';
  dxf += '0\nSECTION\n2\nENTITIES\n';

  for (const el of elements) {
    const x1 = el.x * scale;
    const y1 = el.y * scale;
    const x2 = (el.x + el.w) * scale;
    const y2 = (el.y + el.h) * scale;

    dxf += `0\nLWPOLYLINE\n8\n${el.type}\n90\n4\n70\n1\n`;
    dxf += `10\n${x1.toFixed(2)}\n20\n${y1.toFixed(2)}\n30\n0\n`;
    dxf += `10\n${x2.toFixed(2)}\n20\n${y1.toFixed(2)}\n30\n0\n`;
    dxf += `10\n${x2.toFixed(2)}\n20\n${y2.toFixed(2)}\n30\n0\n`;
    dxf += `10\n${x1.toFixed(2)}\n20\n${y2.toFixed(2)}\n30\n0\n`;

    const cx = ((x1 + x2) / 2).toFixed(2);
    const cy = ((y1 + y2) / 2).toFixed(2);
    dxf += `0\nTEXT\n8\nLABELS\n10\n${cx}\n20\n${cy}\n30\n0\n40\n${(3 * scale).toFixed(2)}\n1\n${el.label}\n`;
  }

  dxf += '0\nENDSEC\n0\nEOF\n';

  const blob = new Blob([dxf], { type: 'application/dxf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `dougong_${dynasty}_${jumps}tiao.dxf`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportExcel(
  dynasty: Dynasty,
  grade: number,
  jumps: number,
  components: ComponentResult[]
): void {
  const header = ['构件名称', '类型', '宽(份)', '高(份)', '深(份)', '宽(mm)', '高(mm)', '深(mm)', '数量', '净材体积(mm³)'];

  const rows = components.map((c) => [
    c.name,
    c.type,
    c.widthFen,
    c.heightFen,
    c.depthFen,
    Number(c.widthMm.toFixed(1)),
    Number(c.heightMm.toFixed(1)),
    Number(c.depthMm.toFixed(1)),
    c.count,
    Number(c.volumeMm3.toFixed(0)),
  ]);

  const totalVolume = components.reduce((sum, c) => sum + c.volumeMm3, 0);
  rows.push(['合计', '', '', '', '', '', '', '', '', Number(totalVolume.toFixed(0))]);

  const wsData = [header, ...rows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  ws['!cols'] = header.map(() => ({ wch: 14 }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '料单');

  XLSX.writeFile(wb, `dougong_${dynasty}${grade}等材_${jumps}跳_料单.xlsx`);
}
