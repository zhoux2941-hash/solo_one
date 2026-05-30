import { useState, useEffect, useRef } from 'react';
import { FileText, Trash2, Plus, Download } from 'lucide-react';
import { useColorStore } from '../store/colorStore';
import { colorApi } from '../utils/api';
import ColorSwatch from '../components/ColorSwatch';
import jsPDF from 'jspdf';
import type { PantoneColor, ColorReportData } from '@shared/types';

type PaperColor = 'bright-white' | 'cream' | 'kraft';

interface PaperColorOption {
  key: PaperColor;
  name: string;
  value: string;
  label: string;
  textColor: string;
}

const paperColors: PaperColorOption[] = [
  { key: 'bright-white', name: '亮白', value: '#FFFFFF', label: '亮白纸', textColor: '#1e293b' },
  { key: 'cream', name: '米黄', value: '#F5F5DC', label: '米黄纸', textColor: '#1e293b' },
  { key: 'kraft', name: '牛皮纸', value: '#D2B48C', label: '牛皮纸', textColor: '#2D1810' },
];

const applicationScenarios = [
  '品牌视觉设计',
  '印刷出版',
  '包装设计',
  'UI/UX 设计',
  '室内设计',
  '服装设计',
  '工业设计',
  '广告创意',
  '其他'
];

const A4_WIDTH = 595;
const A4_HEIGHT = 842;
const MARGIN = 40;

export default function Export() {
  const { selectedColors, removeSelectedColor, clearSelectedColors, toggleSelectedColor, presetColors, setPresetColors } = useColorStore();
  const [title, setTitle] = useState('颜色方案报告');
  const [application, setApplication] = useState('品牌视觉设计');
  const [notes, setNotes] = useState('');
  const [paperColor, setPaperColor] = useState<PaperColor>('bright-white');
  const [reportData, setReportData] = useState<ColorReportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'selected' | 'browse'>('selected');
  const [browseCategory, setBrowseCategory] = useState<string>('');
  const [browseColors, setBrowseColors] = useState<PantoneColor[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const loadPresets = async () => {
      try {
        const res = await colorApi.getPresets();
        setPresetColors(res.colors);
      } catch (err) {
        console.error('Failed to load presets:', err);
      }
    };
    loadPresets();

    colorApi.getCategories().then(res => setCategories(res.categories));
  }, [setPresetColors]);

  useEffect(() => {
    const loadColors = async () => {
      try {
        const res = await colorApi.listPantone(currentPage, 24, browseCategory || undefined);
        setBrowseColors(res.colors);
        setTotalPages(res.totalPages);
      } catch (err) {
        console.error('Failed to load colors:', err);
      }
    };
    loadColors();
  }, [currentPage, browseCategory]);

  useEffect(() => {
    if (selectedColors.length > 0) {
      const generatePreview = async () => {
        try {
          const data = await colorApi.getReportData(
            selectedColors.map(c => c.id),
            title,
            application,
            notes
          );
          setReportData(data);
        } catch (err) {
          console.error('Failed to generate report data:', err);
        }
      };
      generatePreview();
    } else {
      setReportData(null);
    }
  }, [selectedColors, title, application, notes]);

  useEffect(() => {
    if (reportData && previewCanvasRef.current) {
      drawPreview(previewCanvasRef.current);
    }
  }, [reportData, paperColor]);

  const getCurrentPaper = () => paperColors.find(p => p.key === paperColor) || paperColors[0];

  const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 255, g: 255, b: 255 };
  };

  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  const drawPaperTexture = (ctx: CanvasRenderingContext2D, width: number, height: number, paper: PaperColorOption) => {
    const paperRgb = hexToRgb(paper.value);
    ctx.fillStyle = paper.value;
    ctx.fillRect(0, 0, width, height);

    if (paper.key === 'kraft') {
      for (let i = 0; i < 8000; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 2;
        ctx.fillStyle = `rgba(139, 90, 43, ${Math.random() * 0.12})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (paper.key === 'cream') {
      for (let i = 0; i < 5000; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 1.2;
        ctx.fillStyle = `rgba(200, 180, 140, ${Math.random() * 0.08})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const drawPage = (
    ctx: CanvasRenderingContext2D,
    pageIndex: number,
    totalPages: number,
    colorsPerPage: PantoneColor[],
    pageData: {
      title: string;
      application: string;
      notes: string;
      generatedAt: string;
      paper: PaperColorOption;
      totalColorCount: number;
      isFirstPage: boolean;
    }
  ) => {
    const { title, application, notes, generatedAt, paper, totalColorCount, isFirstPage } = pageData;
    const width = A4_WIDTH;
    const height = A4_HEIGHT;
    let y = MARGIN;

    drawPaperTexture(ctx, width, height, paper);

    if (isFirstPage) {
      const headerRgb = hexToRgb('#4F46E5');
      ctx.fillStyle = `rgba(${headerRgb.r}, ${headerRgb.g}, ${headerRgb.b}, 0.95)`;
      ctx.fillRect(0, 0, width, 80);

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.textBaseline = 'top';
      ctx.fillText(title, MARGIN, 28);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillText(`生成时间: ${new Date(generatedAt).toLocaleString('zh-CN')}`, MARGIN, 58);

      y = 100;

      ctx.fillStyle = '#4F46E5';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillText('应用场景', MARGIN, y);
      y += 22;

      ctx.fillStyle = paper.textColor;
      ctx.font = '13px system-ui, sans-serif';
      ctx.fillText(application, MARGIN, y);
      y += 28;

      if (notes) {
        ctx.fillStyle = '#4F46E5';
        ctx.font = 'bold 16px system-ui, sans-serif';
        ctx.fillText('备注说明', MARGIN, y);
        y += 22;

        ctx.fillStyle = paper.textColor;
        ctx.font = '13px system-ui, sans-serif';
        const maxWidth = width - MARGIN * 2;
        const lineHeight = 18;
        const words = notes.split('');
        let line = '';
        for (const word of words) {
          const testLine = line + word;
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth && line !== '') {
            ctx.fillText(line, MARGIN, y);
            line = word;
            y += lineHeight;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, MARGIN, y);
        y += 28;
      }

      ctx.fillStyle = '#4F46E5';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.fillText(`颜色方案 (共 ${totalColorCount} 色)`, MARGIN, y);
      y += 20;
    }

    for (let i = 0; i < colorsPerPage.length; i++) {
      const color = colorsPerPage[i];
      const colorY = y;
      const swatchSize = 50;
      const textX = MARGIN + swatchSize + 16;

      const colorRgb = hexToRgb(color.hex);
      ctx.fillStyle = color.hex;
      drawRoundedRect(ctx, MARGIN, colorY, swatchSize, swatchSize, 6);
      ctx.fill();

      ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.lineWidth = 1;
      drawRoundedRect(ctx, MARGIN, colorY, swatchSize, swatchSize, 6);
      ctx.stroke();

      ctx.fillStyle = paper.textColor;
      ctx.font = 'bold 14px system-ui, sans-serif';
      ctx.fillText(color.pantoneCode, textX, colorY + 4);

      ctx.fillStyle = 'rgba(100, 100, 100, 0.9)';
      ctx.font = '12px system-ui, sans-serif';
      ctx.fillText(`${color.nameZh} · ${color.name}`, textX, colorY + 22);

      ctx.fillStyle = 'rgba(80, 80, 80, 0.9)';
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillText(
        `HEX: ${color.hex}  |  RGB(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b})`,
        textX,
        colorY + 38
      );

      ctx.fillStyle = '#228B22';
      ctx.fillText(
        `CMYK: ${color.cmyk.c.toFixed(0)}%, ${color.cmyk.m.toFixed(0)}%, ${color.cmyk.y.toFixed(0)}%, ${color.cmyk.k.toFixed(0)}%`,
        textX,
        colorY + 52
      );

      y += swatchSize + 18;
    }

    const footerRgb = hexToRgb('#F8FAFC');
    ctx.fillStyle = `rgba(${footerRgb.r}, ${footerRgb.g}, ${footerRgb.b}, 0.9)`;
    ctx.fillRect(0, height - 30, width, 30);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '10px system-ui, sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('ColorSpace Pro - 专业颜色空间转换工具', MARGIN, height - 15);
    ctx.textAlign = 'right';
    ctx.fillText(`第 ${pageIndex + 1} / ${totalPages} 页`, width - MARGIN, height - 15);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  };

  const drawPreview = (canvas: HTMLCanvasElement) => {
    if (!reportData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = 0.5;
    canvas.width = A4_WIDTH * scale;
    canvas.height = A4_HEIGHT * scale;

    ctx.save();
    ctx.scale(scale, scale);

    const colorsPerPage = 6;
    const firstPageColors = reportData.colors.slice(0, colorsPerPage);

    drawPage(ctx, 0, 1, firstPageColors, {
      title: reportData.title,
      application: reportData.application,
      notes: reportData.notes,
      generatedAt: reportData.generatedAt,
      paper: getCurrentPaper(),
      totalColorCount: reportData.colors.length,
      isFirstPage: true
    });

    ctx.restore();
  };

  const generatePDF = async () => {
    if (!reportData || selectedColors.length === 0 || !canvasRef.current) return;

    setIsGenerating(true);
    try {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      canvas.width = A4_WIDTH;
      canvas.height = A4_HEIGHT;

      const colorsPerPage = 6;
      const totalPages = Math.ceil(reportData.colors.length / colorsPerPage);

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });

      for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        const startIdx = pageIndex * colorsPerPage;
        const endIdx = startIdx + colorsPerPage;
        const pageColors = reportData.colors.slice(startIdx, endIdx);

        drawPage(ctx, pageIndex, totalPages, pageColors, {
          title: reportData.title,
          application: reportData.application,
          notes: reportData.notes,
          generatedAt: reportData.generatedAt,
          paper: getCurrentPaper(),
          totalColorCount: reportData.colors.length,
          isFirstPage: pageIndex === 0
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        if (pageIndex > 0) {
          doc.addPage();
        }
        doc.addImage(imgData, 'JPEG', 0, 0, A4_WIDTH, A4_HEIGHT);
      }

      doc.save(`${title}-${Date.now()}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in">
      <canvas ref={canvasRef} className="hidden" />

      <div className="mb-8 text-center">
        <div className="inline-flex items-center space-x-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-rose-400 to-red-600 flex items-center justify-center shadow-lg shadow-rose-500/25">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent">颜色报告导出</h1>
        </div>
        <p className="text-slate-600 max-w-2xl mx-auto">
          选择需要的颜色，填写应用场景和备注，选择纸张底色，一键导出专业的 PDF 颜色方案报告
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="flex space-x-2 mb-4">
            <button
              onClick={() => setActiveTab('selected')}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'selected'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-white text-slate-600 hover:text-slate-800 border border-slate-200'
              }`}
            >
              已选颜色 ({selectedColors.length})
            </button>
            <button
              onClick={() => setActiveTab('browse')}
              className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'browse'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25'
                  : 'bg-white text-slate-600 hover:text-slate-800 border border-slate-200'
              }`}
            >
              浏览色库
            </button>
          </div>

          {activeTab === 'selected' ? (
            <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-slate-800 text-lg">已选择的颜色</h3>
                {selectedColors.length > 0 && (
                  <button
                    onClick={clearSelectedColors}
                    className="flex items-center space-x-1.5 text-sm text-red-500 hover:text-red-600 transition-colors font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>清空</span>
                  </button>
                )}
              </div>

              {selectedColors.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-6">
                    <Plus className="w-12 h-12 text-slate-400" />
                  </div>
                  <p className="text-slate-500 mb-2 text-lg font-medium">还没有选择任何颜色</p>
                  <p className="text-sm text-slate-400">
                    在颜色转换页面点击"添加到报告"，或在右侧浏览色库中选择颜色
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {selectedColors.map((color) => (
                    <div
                      key={color.id}
                      className="relative bg-gradient-to-br from-white to-slate-50 rounded-2xl p-5 group border border-slate-100 hover:border-indigo-200 transition-all hover:shadow-lg"
                    >
                      <button
                        onClick={() => removeSelectedColor(color.id)}
                        className="absolute top-3 right-3 p-2 bg-white/90 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <ColorSwatch hex={color.hex} size="lg" className="mx-auto mb-4" showValues />
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-800">{color.pantoneCode}</p>
                        <p className="text-xs text-slate-500 mt-1">{color.nameZh}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <h3 className="font-semibold text-slate-800 text-lg">Pantone 色库</h3>
                <select
                  value={browseCategory}
                  onChange={(e) => {
                    setBrowseCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                >
                  <option value="">全部色系</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-4 md:grid-cols-6 gap-3">
                {browseColors.map((color) => {
                  const isSelected = selectedColors.some(c => c.id === color.id);
                  return (
                    <button
                      key={color.id}
                      onClick={() => toggleSelectedColor(color)}
                      className={`
                        relative group p-2.5 rounded-2xl transition-all
                        ${isSelected ? 'ring-2 ring-indigo-500 bg-indigo-50 shadow-lg' : 'bg-white hover:bg-slate-50 border border-slate-100 hover:border-indigo-200'}
                      `}
                    >
                      <ColorSwatch
                        hex={color.hex}
                        size="md"
                        pantone={color}
                        selected={isSelected}
                        disableCopy
                      />
                      {isSelected && (
                        <div className="absolute top-1.5 right-1.5 w-6 h-6 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-center items-center space-x-3 mt-8">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors font-medium"
                >
                  上一页
                </button>
                <span className="text-slate-600 font-medium">
                  第 {currentPage} / {totalPages} 页
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors font-medium"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <h3 className="font-semibold text-slate-800 text-lg mb-5">报告设置</h3>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">报告标题</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field"
                  placeholder="输入报告标题"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">应用场景</label>
                <select
                  value={application}
                  onChange={(e) => setApplication(e.target.value)}
                  className="input-field"
                >
                  {applicationScenarios.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">备注说明</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="input-field resize-none"
                  placeholder="输入备注说明..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">纸张底色</label>
                <div className="grid grid-cols-3 gap-3">
                  {paperColors.map((paper) => (
                    <button
                      key={paper.key}
                      onClick={() => setPaperColor(paper.key)}
                      className={`
                        relative flex flex-col items-center space-y-2 p-3 rounded-xl border-2 transition-all
                        ${paperColor === paper.key
                          ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/30'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'}
                      `}
                    >
                      <div
                        className="w-10 h-10 rounded-lg shadow-inner border border-slate-200"
                        style={{ backgroundColor: paper.value }}
                      />
                      <span className="text-xs font-medium text-slate-700">{paper.name}</span>
                      {paperColor === paper.key && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <h3 className="font-semibold text-slate-800 text-lg mb-4">常用专色快捷添加</h3>
            <div className="flex flex-wrap gap-2">
              {presetColors.slice(0, 8).map((color) => {
                const isSelected = selectedColors.some(c => c.id === color.id);
                return (
                  <button
                    key={color.id}
                    onClick={() => toggleSelectedColor(color)}
                    className={`
                      p-2 rounded-xl transition-all border-2
                      ${isSelected ? 'border-indigo-500 ring-2 ring-indigo-500/30' : 'border-transparent hover:border-slate-200'}
                    `}
                    title={color.pantoneCode}
                  >
                    <ColorSwatch hex={color.hex} size="sm" disableCopy />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl p-6 border border-indigo-100 animate-slide-up" style={{ animationDelay: '0.25s' }}>
            <h3 className="font-semibold text-indigo-700 text-lg mb-5">报告预览</h3>
            
            {reportData ? (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl p-2 shadow-xl border border-slate-100">
                  <canvas
                    ref={previewCanvasRef}
                    className="w-full rounded-xl"
                    style={{ aspectRatio: '1/√2' }}
                  />
                </div>

                <button
                  onClick={generatePDF}
                  disabled={isGenerating || selectedColors.length === 0}
                  className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:from-slate-400 disabled:to-slate-400 text-white font-semibold rounded-xl transition-all shadow-xl shadow-indigo-500/30 disabled:shadow-none"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>生成中...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-5 h-5" />
                      <span>导出 PDF 报告</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <p className="font-medium">请先选择颜色以预览报告</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
