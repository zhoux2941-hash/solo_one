import React from 'react';
import { Upload, FileText, AlertCircle, Loader2 } from 'lucide-react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { cn } from '@/utils';

interface FileUploadProps {
  onLoadSample?: () => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onLoadSample }) => {
  const {
    isDragging,
    isLoading,
    fileInputRef,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleInputChange,
    openFileDialog,
  } = useFileUpload();

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div
        className={cn(
          'upload-zone',
          isDragging && 'dragging'
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleInputChange}
          className="hidden"
        />
        
        {isLoading ? (
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-16 h-16 text-primary-500 animate-spin" />
            <p className="text-lg font-medium text-primary-700">正在解析数据...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center">
                <Upload className="w-10 h-10 text-primary-600" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gold-100 flex items-center justify-center">
                <FileText className="w-4 h-4 text-gold-600" />
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-xl font-semibold text-gray-800 mb-2">
                拖拽CSV文件到此处
              </p>
              <p className="text-gray-500 mb-1">
                或<span className="text-primary-600 font-medium cursor-pointer hover:underline">点击选择文件</span>
              </p>
              <p className="text-sm text-gray-400">
                支持 .csv 格式文件
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
        {onLoadSample && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onLoadSample();
            }}
            className="btn-secondary"
            disabled={isLoading}
          >
            加载示例数据
          </button>
        )}
      </div>

      <div className="mt-8 p-4 bg-white rounded-lg border border-gray-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-600">
            <p className="font-medium text-gray-800 mb-2">CSV文件格式要求：</p>
            <p className="mb-1">必需列：<code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">订单日期</code>、<code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">菜品名称</code>、<code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">份数</code>、<code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">单价</code>、<code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">成本价</code></p>
            <p className="mb-1">日期格式：YYYY-MM-DD 或 YYYY/MM/DD</p>
            <p>示例：2024-01-01,红烧肉,25,58,28</p>
          </div>
        </div>
      </div>
    </div>
  );
};
