import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Grid,
  Trash2,
  RotateCcw,
  Download,
  ArrowLeftRight,
  ArrowUpDown,
  RefreshCw,
  X,
  Minimize2,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  FileText,
  Image,
  Shirt,
  Sparkles,
  Shuffle,
} from 'lucide-react';
import { useEditorStore, type SymmetryMode, type PatternElement } from '@/store/editorStore';
import { renderAllElements, hitTestElement } from '@/utils/canvasRenderer';
import { exportToPDF, exportToPNG } from '@/utils/pdfExporter';
import { getPatterns, getPattern, type Pattern } from '@/utils/api';
export default function Editor() {
  const [searchParams] = useSearchParams();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const {
    elements,
    selectedId,
    symmetryMode,
    showGrid,
    canvasWidth,
    canvasHeight,
    showFabricTexture,
    fabricOpacity,
    showCrackEffect,
    crackIntensity,
    crackSeed,
    addElement,
    removeElement,
    updateElement,
    setSelectedId,
    setSymmetryMode,
    toggleGrid,
    clearCanvas,
    setCanvasSize,
    toggleFabricTexture,
    setFabricOpacity,
    toggleCrackEffect,
    setCrackIntensity,
    regenerateCracks,
  } = useEditorStore();
  const selectedElement = elements.find((e) => e.id === selectedId);
  useEffect(() => {
    loadPatterns();
    const patternId = searchParams.get('pattern');
    if (patternId) {
      loadPatternToCanvas(parseInt(patternId));
    }
  }, []);
  useEffect(() => {
    if (containerRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width, height } = entry.contentRect;
          setCanvasSize(Math.floor(width), Math.floor(height - 80));
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    renderAllElements(
      ctx,
      elements,
      selectedId,
      symmetryMode,
      canvasWidth,
      canvasHeight,
      showGrid,
      {
        showFabricTexture,
        fabricOpacity,
        showCrackEffect,
        crackIntensity,
        crackSeed,
      }
    );
  }, [elements, selectedId, symmetryMode, showGrid, canvasWidth, canvasHeight, showFabricTexture, fabricOpacity, showCrackEffect, crackIntensity, crackSeed]);
  const loadPatterns = async () => {
    try {
      const data = await getPatterns();
      setPatterns(data);
    } catch (error) {
      console.error('Failed to load patterns:', error);
    }
  };
  const loadPatternToCanvas = async (id: number) => {
    try {
      const pattern = await getPattern(id);
      if (pattern) {
        const newElement: PatternElement = {
          id: `elem-${Date.now()}`,
          patternId: pattern.id,
          name: pattern.name,
          svgPath: pattern.svg_path,
          x: canvasWidth / 2,
          y: canvasHeight / 2,
          scale: 1,
          rotation: 0,
          flipX: false,
          flipY: false,
        };
        addElement(newElement);
      }
    } catch (error) {
      console.error('Failed to load pattern:', error);
    }
  };
  const handlePatternClick = (pattern: Pattern) => {
    const newElement: PatternElement = {
      id: `elem-${Date.now()}`,
      patternId: pattern.id,
      name: pattern.name,
      svgPath: pattern.svg_path,
      x: canvasWidth / 2,
      y: canvasHeight / 2,
      scale: 1,
      rotation: 0,
      flipX: false,
      flipY: false,
    };
    addElement(newElement);
  };
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvasWidth / rect.width;
      const scaleY = canvasHeight / rect.height;
      const canvasX = (e.clientX - rect.left) * scaleX;
      const canvasY = (e.clientY - rect.top) * scaleY;
      for (let i = elements.length - 1; i >= 0; i--) {
        if (hitTestElement(elements[i], canvasX, canvasY)) {
          setSelectedId(elements[i].id);
          setIsDragging(true);
          setDragOffset({ x: canvasX - elements[i].x, y: canvasY - elements[i].y });
          return;
        }
      }
      setSelectedId(null);
    },
    [elements, setSelectedId, canvasWidth, canvasHeight]
  );
  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging || !selectedId) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvasWidth / rect.width;
      const scaleY = canvasHeight / rect.height;
      const canvasX = (e.clientX - rect.left) * scaleX;
      const canvasY = (e.clientY - rect.top) * scaleY;
      updateElement(selectedId, { x: canvasX - dragOffset.x, y: canvasY - dragOffset.y });
    },
    [isDragging, selectedId, dragOffset, updateElement, canvasWidth, canvasHeight]
  );
  const handleCanvasMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  const handleExportPDF = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    exportToPDF(elements, symmetryMode, canvasWidth, canvasHeight);
  };
  const handleExportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    exportToPNG(canvas);
  };
  const filteredPatterns = patterns.filter((p) =>
    p.name.includes(searchQuery)
  );
  const symmetryOptions: { value: SymmetryMode; label: string; icon: any }[] = [
    { value: 'none', label: '无', icon: X },
    { value: 'horizontal', label: '左右对称', icon: ArrowLeftRight },
    { value: 'vertical', label: '上下对称', icon: ArrowUpDown },
    { value: 'rotational', label: '旋转对称', icon: RefreshCw },
  ];
  return (
    <div className="h-[calc(100vh-72px)] flex bg-[#F5F0E8]">
      <div className="w-64 bg-white border-r border-[#1A2332]/10 flex flex-col">
        <div className="p-4 border-b border-[#1A2332]/10">
          <h3 className="font-bold text-[#1A2332] mb-3">纹样库</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A2332]/50" />
            <input
              type="text"
              placeholder="搜索纹样..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#1A2332]/10 focus:outline-none focus:ring-1 focus:ring-[#D4A84B]"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          <div className="grid grid-cols-3 gap-2">
            {filteredPatterns.map((pattern) => (
              <button
                key={pattern.id}
                onClick={() => handlePatternClick(pattern)}
                className="aspect-square bg-[#F5F0E8] rounded-lg p-2 hover:bg-[#D4A84B]/20 transition-colors group"
                title={pattern.name}
              >
                <svg
                  viewBox="0 0 100 100"
                  className="w-full h-full"
                  style={{
                    fill: 'none',
                    stroke: '#1A2332',
                    strokeWidth: 2.5,
                  }}
                >
                  <path d={pattern.svg_path} />
                </svg>
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex-1 flex flex-col" ref={containerRef}>
        <div className="h-16 bg-white border-b border-[#1A2332]/10 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#1A2332]/70 mr-2">对称模式:</span>
            {symmetryOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setSymmetryMode(opt.value)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all ${
                    symmetryMode === opt.value
                      ? 'bg-[#D4A84B] text-[#1A2332] font-medium'
                      : 'bg-[#F5F0E8] text-[#1A2332]/70 hover:bg-[#1A2332]/10'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:inline">{opt.label}</span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleGrid}
              className={`p-2 rounded-lg transition-all ${
                showGrid
                  ? 'bg-[#D4A84B]/20 text-[#D4A84B]'
                  : 'bg-[#F5F0E8] text-[#1A2332]/70 hover:bg-[#1A2332]/10'
              }`}
              title="显示网格"
            >
              <Grid className="w-5 h-5" />
            </button>
            <button
              onClick={clearCanvas}
              className="p-2 rounded-lg bg-[#F5F0E8] text-[#1A2332]/70 hover:bg-red-100 hover:text-red-600 transition-all"
              title="清空画布"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-[#1A2332] text-white rounded-lg hover:bg-[#1A2332]/90 transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>导出PDF</span>
            </button>
            <button
              onClick={handleExportPNG}
              className="flex items-center gap-2 px-4 py-2 bg-[#D4A84B] text-[#1A2332] rounded-lg hover:bg-[#D4A84B]/90 transition-all"
            >
              <Image className="w-4 h-4" />
              <span>导出PNG</span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4">
          <div className="w-full h-full flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={canvasWidth}
              height={canvasHeight}
              className="rounded-lg shadow-lg cursor-move"
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseUp={handleCanvasMouseUp}
              onMouseLeave={handleCanvasMouseUp}
            />
          </div>
        </div>
      </div>
      <div className="w-72 bg-white border-l border-[#1A2332]/10 flex flex-col">
        <div className="p-4 border-b border-[#1A2332]/10">
          <h3 className="font-bold text-[#1A2332]">属性面板</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {selectedElement ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#1A2332]/70 mb-2">
                  纹样名称
                </label>
                <div className="text-[#1A2332] font-medium">
                  {selectedElement.name}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A2332]/70 mb-2">
                  缩放: {selectedElement.scale.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="5"
                  step="0.1"
                  value={selectedElement.scale}
                  onChange={(e) =>
                    updateElement(selectedElement.id, {
                      scale: parseFloat(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-[#F5F0E8] rounded-lg appearance-none cursor-pointer accent-[#D4A84B]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A2332]/70 mb-2">
                  旋转: {selectedElement.rotation}°
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="1"
                    value={selectedElement.rotation}
                    onChange={(e) =>
                      updateElement(selectedElement.id, {
                        rotation: parseInt(e.target.value),
                      })
                    }
                    className="flex-1 h-2 bg-[#F5F0E8] rounded-lg appearance-none cursor-pointer accent-[#D4A84B]"
                  />
                  <button
                    onClick={() =>
                      updateElement(selectedElement.id, {
                        rotation: (selectedElement.rotation + 15) % 360,
                      })
                    }
                    className="p-2 rounded-lg bg-[#F5F0E8] hover:bg-[#1A2332]/10 transition-colors"
                  >
                    <RotateCw className="w-4 h-4 text-[#1A2332]/70" />
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A2332]/70 mb-2">
                  镜像
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      updateElement(selectedElement.id, {
                        flipX: !selectedElement.flipX,
                      })
                    }
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
                      selectedElement.flipX
                        ? 'bg-[#D4A84B] text-[#1A2332]'
                        : 'bg-[#F5F0E8] text-[#1A2332]/70 hover:bg-[#1A2332]/10'
                    }`}
                  >
                    <FlipHorizontal className="w-4 h-4" />
                    <span className="text-sm">水平</span>
                  </button>
                  <button
                    onClick={() =>
                      updateElement(selectedElement.id, {
                        flipY: !selectedElement.flipY,
                      })
                    }
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition-all ${
                      selectedElement.flipY
                        ? 'bg-[#D4A84B] text-[#1A2332]'
                        : 'bg-[#F5F0E8] text-[#1A2332]/70 hover:bg-[#1A2332]/10'
                    }`}
                  >
                    <FlipVertical className="w-4 h-4" />
                    <span className="text-sm">垂直</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A2332]/70 mb-2">
                  位置
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-[#1A2332]/50">X</span>
                    <input
                      type="number"
                      value={Math.round(selectedElement.x)}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          x: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-[#1A2332]/10 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4A84B]"
                    />
                  </div>
                  <div>
                    <span className="text-xs text-[#1A2332]/50">Y</span>
                    <input
                      type="number"
                      value={Math.round(selectedElement.y)}
                      onChange={(e) =>
                        updateElement(selectedElement.id, {
                          y: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-[#1A2332]/10 text-sm focus:outline-none focus:ring-1 focus:ring-[#D4A84B]"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={() => removeElement(selectedElement.id)}
                className="w-full flex items-center justify-center gap-2 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>删除纹样</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <Minimize2 className="w-12 h-12 text-[#1A2332]/20 mx-auto mb-4" />
              <p className="text-[#1A2332]/50 text-sm">
                点击画布上的纹样来编辑属性
              </p>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-[#1A2332]/10 space-y-4">
          <div>
            <h4 className="text-sm font-bold text-[#1A2332] mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4A84B]" />
              蜡染模拟
            </h4>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-[#1A2332]/70 flex items-center gap-1.5">
                    <Shirt className="w-3.5 h-3.5" />
                    布料质感
                  </span>
                  <button
                    onClick={toggleFabricTexture}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      showFabricTexture ? 'bg-[#D4A84B]' : 'bg-[#1A2332]/20'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        showFabricTexture ? 'left-5.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
                {showFabricTexture && (
                  <div>
                    <div className="flex justify-between text-xs text-[#1A2332]/50 mb-1">
                      <span>纹理强度</span>
                      <span>{Math.round(fabricOpacity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={fabricOpacity}
                      onChange={(e) => setFabricOpacity(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-[#F5F0E8] rounded-lg appearance-none cursor-pointer accent-[#D4A84B]"
                    />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-[#1A2332]/70 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    裂纹效果
                  </span>
                  <button
                    onClick={toggleCrackEffect}
                    className={`relative w-10 h-5 rounded-full transition-colors ${
                      showCrackEffect ? 'bg-[#D4A84B]' : 'bg-[#1A2332]/20'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                        showCrackEffect ? 'left-5.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
                {showCrackEffect && (
                  <div>
                    <div className="flex justify-between text-xs text-[#1A2332]/50 mb-1">
                      <span>裂纹密度</span>
                      <span>{Math.round(crackIntensity * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="1"
                      step="0.05"
                      value={crackIntensity}
                      onChange={(e) => setCrackIntensity(parseFloat(e.target.value))}
                      className="w-full h-1.5 bg-[#F5F0E8] rounded-lg appearance-none cursor-pointer accent-[#D4A84B]"
                    />
                    <button
                      onClick={regenerateCracks}
                      className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[#F5F0E8] text-[#1A2332]/70 rounded-lg hover:bg-[#1A2332]/10 transition-colors w-full justify-center"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      重新生成裂纹
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="text-xs text-[#1A2332]/50">
            纹样数量: {elements.length}
          </div>
        </div>
      </div>
    </div>
  );
}
