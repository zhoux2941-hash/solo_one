import React, { useState } from 'react';
import { BayesianParams, BayesianResult, TestResult } from '../types';
import { exportToPDF } from '../utils/pdfExport';
import { FileDown, Loader2 } from 'lucide-react';

interface ExportButtonProps {
  params: BayesianParams;
  result: BayesianResult;
  targetId: string;
  testResults?: TestResult[];
  viewMode: 'single' | 'iteration';
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  params,
  result,
  targetId,
  testResults,
  viewMode,
}) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportToPDF(targetId, {
        params,
        result,
        testResults,
        viewMode,
      });
    } catch (error) {
      console.error('Export failed:', error);
      alert('PDF导出失败，请重试');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-medium rounded-lg shadow-md hover:shadow-lg hover:from-teal-600 hover:to-emerald-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isExporting ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <FileDown className="w-5 h-5" />
      )}
      {isExporting ? '导出中...' : '导出PDF报告'}
    </button>
  );
};
