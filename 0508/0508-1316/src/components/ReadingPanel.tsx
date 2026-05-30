import React, { useState, useRef, useEffect } from 'react';
import { X, BookOpen, FileText, Quote, Pencil, Check, Undo2, RotateCcw, History, ChevronDown, ChevronUp } from 'lucide-react';
import { useSlipsStore } from '../store/useSlipsStore';
import { TextCorrection } from '../types';
import { cn } from '../utils/cn';

export const ReadingPanel: React.FC = () => {
  const { selectedSlipId, slips, selectSlip, correctText, revertCorrection, revertAllCorrections } = useSlipsStore();
  const selectedSlip = slips.find((s) => s.id === selectedSlipId);

  const [editingField, setEditingField] = useState<'modernText' | 'annotation' | null>(null);
  const [editValue, setEditValue] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const editRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editingField && editRef.current) {
      editRef.current.focus();
      editRef.current.select();
    }
  }, [editingField]);

  useEffect(() => {
    setEditingField(null);
    setShowHistory(false);
  }, [selectedSlipId]);

  if (!selectedSlip) {
    return (
      <div className="w-80 bg-gradient-to-b from-stone-100 to-stone-200 p-6 rounded-l-xl shadow-xl">
        <div className="h-full flex flex-col items-center justify-center text-stone-400">
          <BookOpen className="w-16 h-16 mb-4 opacity-50" />
          <p className="text-lg font-medium">点击竹简</p>
          <p className="text-sm mt-1">查看文字释读</p>
        </div>
      </div>
    );
  }

  const displayModernText = selectedSlip.correctedModernText ?? selectedSlip.modernText;
  const displayAnnotation = selectedSlip.correctedAnnotation ?? selectedSlip.annotation;
  const hasCorrections = selectedSlip.corrections.length > 0;
  const isModified = selectedSlip.correctedModernText !== null || selectedSlip.correctedAnnotation !== null;

  const handleStartEdit = (field: 'modernText' | 'annotation') => {
    const currentVal = field === 'modernText' ? displayModernText : displayAnnotation;
    setEditValue(currentVal);
    setEditingField(field);
  };

  const handleSaveEdit = () => {
    if (editingField) {
      correctText(selectedSlip.id, editingField, editValue);
      setEditingField(null);
      setEditValue('');
    }
  };

  const handleCancelEdit = () => {
    setEditingField(null);
    setEditValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  const formatTimestamp = (ts: number) => {
    const d = new Date(ts);
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`;
  };

  const getDiffSpans = (original: string, corrected: string) => {
    const origChars = original.split('');
    const corrChars = corrected.split('');
    const spans: React.ReactNode[] = [];
    const maxLen = Math.max(origChars.length, corrChars.length);
    
    for (let i = 0; i < maxLen; i++) {
      if (origChars[i] === corrChars[i]) {
        spans.push(<span key={i}>{corrChars[i]}</span>);
      } else if (i < corrChars.length && i >= origChars.length) {
        spans.push(
          <span key={i} className="bg-green-200 text-green-800 rounded px-0.5">{corrChars[i]}</span>
        );
      } else if (i < corrChars.length) {
        spans.push(
          <span key={i} className="bg-yellow-200 text-yellow-800 rounded px-0.5 underline decoration-red-500">{corrChars[i]}</span>
        );
      }
    }
    return spans;
  };

  return (
    <div className="w-80 bg-gradient-to-b from-amber-50 to-stone-100 p-6 rounded-l-xl shadow-xl overflow-y-auto max-h-screen">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-stone-700 to-stone-800 rounded-lg flex items-center justify-center shadow-md">
            <FileText className="w-5 h-5 text-amber-100" />
          </div>
          <div>
            <h2 className="text-stone-800 font-bold">简牍释读</h2>
            <p className="text-stone-500 text-xs">
              第 {selectedSlip.currentIndex + 1} 号简
              {isModified && (
                <span className="ml-2 text-amber-600 font-medium">已校订</span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={() => selectSlip(null)}
          className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-500 hover:text-stone-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-gradient-to-br from-amber-100 to-amber-200 rounded-xl p-4 shadow-inner">
          <div className="flex items-center gap-2 mb-2">
            <Quote className="w-4 h-4 text-amber-700" />
            <span className="text-amber-800 text-xs font-bold uppercase tracking-wider">摹写字形</span>
            <span className="text-amber-600 text-xs ml-auto">原始</span>
          </div>
          <div 
            className="text-2xl font-bold text-stone-900 leading-relaxed tracking-wider"
            style={{ fontFamily: "'Noto Serif SC', serif" }}
          >
            {selectedSlip.ancientText}
          </div>
          <div className="mt-2 text-amber-700 text-xs">
            原简顺序：第 {selectedSlip.order} 号
          </div>
        </div>

        <div className={cn(
          "bg-white rounded-xl p-4 shadow-md border-2 transition-colors",
          editingField === 'modernText' ? 'border-amber-400' : 'border-transparent',
          selectedSlip.correctedModernText !== null && editingField !== 'modernText' && 'border-amber-300'
        )}>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-4 h-4 bg-stone-700 rounded" />
            <span className="text-stone-700 text-xs font-bold uppercase tracking-wider">现代汉字</span>
            {selectedSlip.correctedModernText !== null && (
              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">已修改</span>
            )}
            {editingField !== 'modernText' && (
              <button
                onClick={() => handleStartEdit('modernText')}
                className="ml-auto p-1 rounded hover:bg-stone-100 text-stone-400 hover:text-amber-600 transition-colors"
                title="校订释读文字"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {editingField === 'modernText' ? (
            <div className="space-y-2">
              <textarea
                ref={editRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full p-2 text-lg text-stone-800 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                style={{ fontFamily: "'Noto Serif SC', serif" }}
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs rounded-lg font-medium transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  保存
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1 px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-600 text-xs rounded-lg font-medium transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div 
                className="text-lg text-stone-800 leading-relaxed"
                style={{ fontFamily: "'Noto Serif SC', serif" }}
              >
                {displayModernText}
              </div>
              {selectedSlip.correctedModernText !== null && (
                <div className="mt-2 text-xs text-stone-400 line-through">
                  原文：{selectedSlip.modernText}
                </div>
              )}
            </div>
          )}
        </div>

        <div className={cn(
          "bg-stone-50 rounded-xl p-4 border transition-colors",
          editingField === 'annotation' ? 'border-amber-400' : 'border-stone-200',
          selectedSlip.correctedAnnotation !== null && editingField !== 'annotation' && 'border-amber-300'
        )}>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-stone-600" />
            <span className="text-stone-700 text-xs font-bold uppercase tracking-wider">释读说明</span>
            {selectedSlip.correctedAnnotation !== null && (
              <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-medium">已修改</span>
            )}
            {editingField !== 'annotation' && (
              <button
                onClick={() => handleStartEdit('annotation')}
                className="ml-auto p-1 rounded hover:bg-stone-100 text-stone-400 hover:text-amber-600 transition-colors"
                title="校订释读说明"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>

          {editingField === 'annotation' ? (
            <div className="space-y-2">
              <textarea
                ref={editRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full p-2 text-sm text-stone-600 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs rounded-lg font-medium transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  保存
                </button>
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1 px-3 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-600 text-xs rounded-lg font-medium transition-colors"
                >
                  取消
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-stone-600 text-sm leading-relaxed">
                {displayAnnotation}
              </p>
              {selectedSlip.correctedAnnotation !== null && (
                <div className="mt-2 text-xs text-stone-400 line-through">
                  原文：{selectedSlip.annotation}
                </div>
              )}
            </div>
          )}
        </div>

        {hasCorrections && (
          <div className="rounded-xl border border-stone-200 overflow-hidden">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between px-4 py-3 bg-stone-50 hover:bg-stone-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-amber-600" />
                <span className="text-stone-700 text-xs font-bold">校订记录</span>
                <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                  {selectedSlip.corrections.length}
                </span>
              </div>
              {showHistory ? (
                <ChevronUp className="w-4 h-4 text-stone-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-stone-400" />
              )}
            </button>
            
            {showHistory && (
              <div className="px-4 py-3 space-y-3 max-h-48 overflow-y-auto">
                {selectedSlip.corrections.map((correction: TextCorrection) => (
                  <div 
                    key={correction.id}
                    className="bg-white rounded-lg p-3 border border-stone-100 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-stone-500">
                        {correction.field === 'modernText' ? '现代汉字' : '释读说明'}
                      </span>
                      <span className="text-xs text-stone-400">
                        {formatTimestamp(correction.timestamp)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs text-stone-400 line-through">
                        {correction.originalText}
                      </div>
                      <div className="text-xs text-amber-700 font-medium">
                        {getDiffSpans(correction.originalText, correction.correctedText)}
                      </div>
                    </div>
                    <button
                      onClick={() => revertCorrection(selectedSlip.id, correction.id)}
                      className="mt-2 flex items-center gap-1 text-xs text-stone-400 hover:text-red-500 transition-colors"
                      title="撤销此修改"
                    >
                      <Undo2 className="w-3 h-3" />
                      撤销
                    </button>
                  </div>
                ))}
                
                {selectedSlip.corrections.length > 1 && (
                  <button
                    onClick={() => revertAllCorrections(selectedSlip.id)}
                    className="w-full flex items-center justify-center gap-1 py-2 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors font-medium"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    全部撤销
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {isModified && !hasCorrections && (
          <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
            <Pencil className="w-4 h-4 text-amber-500" />
            <span className="text-xs text-amber-700">释文已校订</span>
          </div>
        )}

        <div className="pt-4 border-t border-stone-300">
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-500">出土地点</span>
            <span className="text-stone-700 font-medium">湖北荆门郭店</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-2">
            <span className="text-stone-500">年代</span>
            <span className="text-stone-700 font-medium">战国中期</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-2">
            <span className="text-stone-500">文献来源</span>
            <span className="text-stone-700 font-medium">《老子》甲本</span>
          </div>
        </div>
      </div>
    </div>
  );
};
