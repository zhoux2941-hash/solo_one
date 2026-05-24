import React, { useState } from 'react';
import { X, Download, Image as ImageIcon, FileText, Clock, User, CheckCircle } from 'lucide-react';
import type Konva from 'konva';
import { useChartStore } from '../store/useChartStore';
import { exportChartAsImage, exportChartAsPDF, downloadFile, downloadBlob, generateExportFilename } from '../utils/exportUtils';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  getStage: () => Konva.Stage | null;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({ isOpen, onClose, getStage }) => {
  const { currentOperator, collisions } = useChartStore();
  const [format, setFormat] = useState<'png' | 'pdf'>('png');
  const [includeTimestamp, setIncludeTimestamp] = useState(true);
  const [includeOperator, setIncludeOperator] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const dangerCount = collisions.filter((c) => c.severity === 'danger').length;

  const handleExport = async () => {
    const stage = getStage();
    if (!stage) return;

    setIsExporting(true);
    setExportSuccess(false);

    try {
      const options = {
        format,
        includeTimestamp,
        includeOperator,
        operatorName: currentOperator,
      };

      if (format === 'png') {
        const dataUrl = await exportChartAsImage(stage, options);
        const filename = generateExportFilename('png');
        downloadFile(dataUrl, filename);
      } else {
        const blob = await exportChartAsPDF(stage, options);
        const filename = generateExportFilename('pdf');
        downloadBlob(blob, filename);
      }

      setExportSuccess(true);
      setTimeout(() => {
        onClose();
        setExportSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-800 border border-slate-600 rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="font-bold text-lg text-white" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            导出值班图
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
            disabled={isExporting}
          >
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {dangerCount > 0 && (
            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-400 text-sm">
                <Clock size={14} />
                <span>当前存在 {dangerCount} 个严重碰撞问题，建议先修复后导出</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">导出格式</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormat('png')}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  format === 'png'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                }`}
              >
                <ImageIcon size={24} className={format === 'png' ? 'text-blue-400' : 'text-slate-400'} />
                <span className={`text-sm font-medium ${format === 'png' ? 'text-blue-400' : 'text-slate-300'}`}>
                  PNG 图片
                </span>
              </button>
              <button
                onClick={() => setFormat('pdf')}
                className={`p-4 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                  format === 'pdf'
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                }`}
              >
                <FileText size={24} className={format === 'pdf' ? 'text-blue-400' : 'text-slate-400'} />
                <span className={`text-sm font-medium ${format === 'pdf' ? 'text-blue-400' : 'text-slate-300'}`}>
                  PDF 文档
                </span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">导出选项</label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeTimestamp}
                onChange={(e) => setIncludeTimestamp(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800"
              />
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-slate-400" />
                <span className="text-sm text-slate-300">包含导出时间戳</span>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeOperator}
                onChange={(e) => setIncludeOperator(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 focus:ring-offset-slate-800"
              />
              <div className="flex items-center gap-2">
                <User size={16} className="text-slate-400" />
                <span className="text-sm text-slate-300">包含值班员信息</span>
                {includeOperator && (
                  <span className="text-xs text-slate-500">({currentOperator})</span>
                )}
              </div>
            </label>
          </div>
        </div>

        <div className="p-4 border-t border-slate-700 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-slate-700 text-slate-300 rounded-lg font-medium hover:bg-slate-600 transition-colors"
            disabled={isExporting}
          >
            取消
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exportSuccess ? (
              <>
                <CheckCircle size={18} />
                导出成功
              </>
            ) : isExporting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                导出中...
              </>
            ) : (
              <>
                <Download size={18} />
                导出
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
