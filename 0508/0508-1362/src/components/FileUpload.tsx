import React, { useCallback, useState } from 'react';
import { Upload, FileWarning, Loader2 } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isParsing: boolean;
  error: string | null;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isParsing, error }) => {
  const [isDragging, setIsDragging] = useState(false);

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
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileSelect(files[0]);
    }
  }, [onFileSelect]);

  return (
    <div className="w-full">
      <label
        className={`relative block w-full h-48 border-2 border-dashed rounded-xl transition-all duration-300 cursor-pointer
          ${isDragging 
            ? 'border-blue-500 bg-blue-500/10 scale-[1.01]' 
            : 'border-slate-600 hover:border-slate-500 bg-slate-800/50 hover:bg-slate-800'
          }
          ${isParsing ? 'pointer-events-none opacity-70' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="hidden"
          onChange={handleFileInput}
          accept=".elf,.so,.o,.a,executable/*"
          disabled={isParsing}
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
          {isParsing ? (
            <>
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <span className="text-slate-300 font-medium">解析中...</span>
            </>
          ) : (
            <>
              <div className={`p-4 rounded-full transition-colors duration-300 ${isDragging ? 'bg-blue-500/20' : 'bg-slate-700/50'}`}>
                <Upload className={`w-8 h-8 transition-colors duration-300 ${isDragging ? 'text-blue-400' : 'text-slate-400'}`} />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-200">
                  {isDragging ? '释放以上传文件' : '拖拽 ELF 文件到此处'}
                </p>
                <p className="text-sm text-slate-400 mt-1">
                  或 <span className="text-blue-400 hover:text-blue-300">点击选择文件</span>
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  支持 .elf, .so, .o, .a 及无后缀的 ELF 可执行文件
                </p>
              </div>
            </>
          )}
        </div>
      </label>

      {error && (
        <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3">
          <FileWarning className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium">解析错误</p>
            <p className="text-red-300/80 text-sm">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
};
