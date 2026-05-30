import html2canvas from 'html2canvas';
import { Role, Temple, Ending, Badge } from '@/types';
import { temples } from '@/data/temples';
import { badges as allBadges } from '@/data/badges';

interface ExportData {
  role: Role | null;
  merit: number;
  completedTemples: string[];
  completedTasks: string[];
  templeDetails: Temple[];
  unlockedBadges: string[];
  badgeDetails: Badge[];
  currentEnding: Ending | null;
  exportTime: string;
  progress: number;
  taskProgress: number;
}

export async function exportRouteMap(elementId: string, fileName: string = '绕三灵路线图.png'): Promise<void> {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`未找到ID为 "${elementId}" 的元素`);
  }

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2,
      useCORS: true,
      logging: false,
    });

    const link = document.createElement('a');
    link.download = fileName;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error('导出路线图失败:', error);
    throw error;
  }
}

export function generateExportData(
  role: Role | null,
  merit: number,
  completedTemples: string[],
  completedTasks: string[],
  unlockedBadges: string[],
  currentEnding: Ending | null
): ExportData {
  const templeDetails = temples.filter((temple) =>
    completedTemples.includes(temple.id)
  );

  const badgeDetails = allBadges.filter((badge) =>
    unlockedBadges.includes(badge.id)
  );

  const progress = temples.length > 0
    ? Math.round((completedTemples.length / temples.length) * 100)
    : 0;

  const taskProgress = completedTasks.length;

  return {
    role,
    merit,
    completedTemples,
    completedTasks,
    templeDetails,
    unlockedBadges,
    badgeDetails,
    currentEnding,
    exportTime: new Date().toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    progress,
    taskProgress,
  };
}

export function downloadExportData(data: ExportData, fileName: string = '绕三灵游戏记录.json'): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
