import React, { useState } from 'react';
import { useIncenseStore } from '../store/useIncenseStore';
import { getGrindLabel } from '../utils/incenseSimulator';
import jsPDF from 'jspdf';
import { Download, FileText, Loader2 } from 'lucide-react';

export const PDFExport: React.FC = () => {
  const { selectedSpices, analysis, formulaName, incenseState } = useIncenseStore();
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!analysis || selectedSpices.length === 0) return;

    setExporting(true);

    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;

      doc.setFillColor(245, 240, 230);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      doc.setDrawColor(139, 69, 19);
      doc.setLineWidth(1);
      doc.rect(margin - 5, margin - 5, pageWidth - 2 * margin + 10, pageHeight - 2 * margin + 10, 'S');

      doc.setDrawColor(210, 180, 140);
      doc.setLineWidth(0.5);
      doc.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.setTextColor(139, 69, 19);
      const title = formulaName || '自定义香方';
      const titleWidth = doc.getTextWidth(title);
      doc.text(title, (pageWidth - titleWidth) / 2, margin + 20);

      doc.setFontSize(12);
      doc.setTextColor(139, 90, 43);
      const subtitle = '香 方 配 伍 卡 片';
      const subtitleWidth = doc.getTextWidth(subtitle);
      doc.text(subtitle, (pageWidth - subtitleWidth) / 2, margin + 35);

      doc.setDrawColor(139, 69, 19);
      doc.setLineWidth(0.5);
      doc.line(margin + 30, margin + 42, pageWidth - margin - 30, margin + 42);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(139, 69, 19);
      doc.text('【 香 气 类 型 】', margin + 10, margin + 65);

      doc.setFontSize(18);
      doc.setTextColor(200, 80, 50);
      const aromaType = analysis.aromaType;
      const aromaWidth = doc.getTextWidth(aromaType);
      doc.text(aromaType, (pageWidth - aromaWidth) / 2, margin + 65);

      doc.setFontSize(11);
      doc.setTextColor(100, 80, 60);
      doc.text(`总重量: ${analysis.totalWeight}g`, margin + 10, margin + 80);
      doc.text(`配伍评分: ${analysis.overallScore}分`, pageWidth - margin - 40, margin + 80);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(139, 69, 19);
      doc.text('【 配 伍 明 细 】', margin + 10, margin + 100);

      let yPos = margin + 115;
      doc.setFontSize(11);
      selectedSpices.forEach((item, index) => {
        doc.setTextColor(80, 60, 40);
        doc.text(`${index + 1}.`, margin + 15, yPos);
        doc.setTextColor(60, 40, 20);
        doc.text(`${item.spice.name}（${item.spice.alias}）`, margin + 25, yPos);
        doc.setTextColor(139, 69, 19);
        doc.text(`${item.grams}g`, pageWidth - margin - 20, yPos, { align: 'right' });
        yPos += 10;
      });

      yPos += 5;
      doc.setDrawColor(210, 180, 140);
      doc.line(margin + 10, yPos, pageWidth - margin - 10, yPos);
      yPos += 15;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(139, 69, 19);
      doc.text('【 香 气 层 次 】', margin + 10, yPos);
      yPos += 15;

      doc.setFontSize(11);
      doc.setTextColor(80, 120, 180);
      doc.text(`前调: ${analysis.topNote}`, margin + 20, yPos);
      yPos += 10;
      doc.setTextColor(200, 140, 60);
      doc.text(`中调: ${analysis.middleNote}`, margin + 20, yPos);
      yPos += 10;
      doc.setTextColor(100, 100, 100);
      doc.text(`尾调: ${analysis.baseNote}`, margin + 20, yPos);
      yPos += 15;

      doc.setDrawColor(210, 180, 140);
      doc.line(margin + 10, yPos, pageWidth - margin - 10, yPos);
      yPos += 15;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(139, 69, 19);
      doc.text('【 熏 香 参 考 】', margin + 10, yPos);
      yPos += 15;

      doc.setFontSize(11);
      doc.setTextColor(80, 60, 40);
      doc.text(`建议炉温: 150-180℃`, margin + 20, yPos);
      yPos += 10;
      doc.text(`研磨度: ${getGrindLabel(incenseState.grindLevel)} (${incenseState.grindLevel}/10)`, margin + 20, yPos);
      yPos += 10;
      doc.text(`最佳出香率: 约85-100%`, margin + 20, yPos);
      yPos += 10;
      doc.text(`熏香时长: 30-60分钟`, margin + 20, yPos);
      yPos += 15;

      doc.setDrawColor(210, 180, 140);
      doc.line(margin + 10, yPos, pageWidth - margin - 10, yPos);
      yPos += 15;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(139, 69, 19);
      doc.text('【 配 伍 建 议 】', margin + 10, yPos);
      yPos += 12;

      doc.setFontSize(10);
      doc.setTextColor(80, 60, 40);
      const suggestionLines = doc.splitTextToSize(analysis.suggestion, pageWidth - 2 * margin - 20);
      doc.text(suggestionLines, margin + 20, yPos);
      yPos += suggestionLines.length * 6 + 10;

      doc.setDrawColor(210, 180, 140);
      doc.line(margin + 10, yPos, pageWidth - margin - 10, yPos);
      yPos += 15;

      const now = new Date();
      const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`;
      doc.setFontSize(10);
      doc.setTextColor(150, 130, 100);
      doc.text(`生成日期: ${dateStr}`, margin + 10, pageHeight - margin - 10);
      doc.text('传统香方配伍模拟系统', pageWidth - margin - 10, pageHeight - margin - 10, { align: 'right' });

      doc.setFillColor(139, 69, 19);
      doc.circle(pageWidth - margin - 25, margin + 25, 15, 'S');
      doc.setFontSize(8);
      doc.setTextColor(139, 69, 19);
      doc.text('香', pageWidth - margin - 28, margin + 22);
      doc.text('道', pageWidth - margin - 28, margin + 30);

      doc.save(`${formulaName || '香方'}_香方卡片.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setExporting(false);
    }
  };

  const canExport = analysis && selectedSpices.length > 0;

  return (
    <div className="bg-gradient-to-br from-stone-50 to-amber-50/50 rounded-xl 
      border border-stone-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-amber-100 rounded-lg">
          <FileText className="text-amber-700" size={24} />
        </div>
        <div>
          <h3 className="font-bold text-stone-800">香方卡片</h3>
          <p className="text-sm text-stone-500">导出精美PDF香方卡片</p>
        </div>
      </div>

      <div className="bg-white rounded-xl p-4 border border-stone-200 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-stone-600">当前香方</span>
          <span className="font-medium text-stone-800">
            {formulaName || '未命名'}
          </span>
        </div>
        <div className="flex items-center justify-between text-sm mt-2">
          <span className="text-stone-600">香料种类</span>
          <span className="font-medium text-stone-800">{selectedSpices.length} 味</span>
        </div>
        {analysis && (
          <>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-stone-600">总重量</span>
              <span className="font-medium text-stone-800">{analysis.totalWeight}g</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-stone-600">香气类型</span>
              <span className="font-medium text-amber-600">{analysis.aromaType}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-stone-600">研磨度</span>
              <span className="font-medium text-orange-600">
                {getGrindLabel(incenseState.grindLevel)} ({incenseState.grindLevel}/10)
              </span>
            </div>
          </>
        )}
      </div>

      <button
        onClick={handleExport}
        disabled={!canExport || exporting}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl 
          font-medium transition-all duration-300
          ${canExport && !exporting
            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600 shadow-lg hover:shadow-amber-500/30'
            : 'bg-stone-200 text-stone-400 cursor-not-allowed'
          }`}
      >
        {exporting ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            生成中...
          </>
        ) : (
          <>
            <Download size={20} />
            {canExport ? '导出PDF香方卡片' : '请先选择香料'}
          </>
        )}
      </button>
    </div>
  );
};
