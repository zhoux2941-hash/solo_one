import React, { useState, useCallback } from 'react';
import { Upload, FileText, X, Check, AlertCircle, Database, Wand2 } from 'lucide-react';
import { parseCsvFile, generateSampleData } from '../utils/csvParser';
import { useAppStore } from '../store/useAppStore';

export const FileUpload: React.FC = () => {
  const [isDragging, setIsDragging] = useState(false);
  const { setRecords, setLoading, setError, records, fileName, corrections, clearData } = useAppStore();

  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setError('请上传CSV格式的文件');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await parseCsvFile(file);
      
      if (result.records.length === 0) {
        setError('未解析到有效数据，请检查文件格式');
        return;
      }

      setRecords(result.records, file.name, result.corrections);

      if (result.errorCount > 0 || result.corrections.length > 0) {
        const messages: string[] = [];
        messages.push(`成功解析 ${result.records.length} 条记录`);
        if (result.errorCount > 0) {
          messages.push(`跳过 ${result.errorCount} 条无效数据`);
        }
        if (result.corrections.length > 0) {
          messages.push(`自动修正 ${result.corrections.length} 处错别字`);
        }
        setError(messages.join('，'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '文件解析失败');
    } finally {
      setLoading(false);
    }
  }, [setRecords, setLoading, setError]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFile(files[0]);
    }
    e.target.value = '';
  }, [handleFile]);

  const handleLoadSampleData = useCallback(() => {
    const sampleData = generateSampleData();
    setRecords(sampleData, '示例数据');
  }, [setRecords]);

  if (records.length > 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <FileText className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-800">{fileName}</span>
                {corrections.length > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                    <Wand2 className="w-3 h-3" />
                    自动修正 {corrections.length} 处
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500">共 {records.length} 条记录</p>
            </div>
          </div>
          <button
            onClick={clearData}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {corrections.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Wand2 className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">错别字修正记录</span>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {corrections.slice(0, 10).map((correction, index) => (
                <div key={index} className="flex items-center gap-3 text-xs bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-gray-400 whitespace-nowrap">第{correction.row}行</span>
                  <span className="text-gray-500 whitespace-nowrap">{correction.field}</span>
                  <span className="text-red-500 line-through whitespace-nowrap">{correction.original}</span>
                  <span className="text-gray-400">→</span>
                  <span className="text-green-600 font-medium whitespace-nowrap">{correction.corrected}</span>
                </div>
              ))}
              {corrections.length > 10 && (
                <p className="text-xs text-gray-400 text-center py-2">
                  还有 {corrections.length - 10} 处修正...
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex flex-col sm:flex-row gap-4">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`flex-1 border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
            isDragging
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-green-400 hover:bg-gray-50'
          }`}
        >
          <input
            type="file"
            accept=".csv"
            onChange={handleFileInput}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="w-12 h-12 mx-auto mb-3 bg-green-50 rounded-full flex items-center justify-center">
              <Upload className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-gray-700">拖拽CSV文件到此处</p>
            <p className="text-xs text-gray-500 mt-1">或点击选择文件</p>
          </label>
        </div>
        
        <div className="flex flex-col justify-center">
          <div className="text-center text-gray-400 text-sm mb-2 sm:hidden">或</div>
          <div className="hidden sm:block text-gray-400 text-sm px-4 self-center">或</div>
          <button
            onClick={handleLoadSampleData}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors font-medium text-sm"
          >
            <Database className="w-4 h-4" />
            加载示例数据
          </button>
        </div>
      </div>
      
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-500">
          <span className="font-medium">CSV格式要求：</span>
          垃圾袋ID、投放时间、居民楼号、垃圾类型、是否正确投放
        </p>
      </div>
    </div>
  );
};
