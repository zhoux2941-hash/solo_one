import { memo, useCallback, useRef, useState } from 'react';
import { Upload, FileText, X, Loader2, Play } from 'lucide-react';
import { useGitLog } from '../hooks/useGitLog';
import { useStore } from '../store/useStore';
import { generateSampleData } from '../utils/parser';

interface FileUploadProps {
  onSuccess?: () => void;
}

export const FileUpload = memo(function FileUpload({ onSuccess }: FileUploadProps) {
  const { handleFileUpload, clearData } = useGitLog();
  const { isLoading, error, fileName, commits, setCommits } = useStore();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      const success = await handleFileUpload(file);
      if (success && onSuccess) {
        onSuccess();
      }
    }
  }, [handleFileUpload, onSuccess]);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const success = await handleFileUpload(file);
      if (success && onSuccess) {
        onSuccess();
      }
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFileUpload, onSuccess]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleLoadSample = useCallback(() => {
    const sampleData = generateSampleData();
    setCommits(sampleData);
    onSuccess?.();
  }, [setCommits, onSuccess]);

  const hasData = commits.length > 0;

  return (
    <div className="glass rounded-2xl p-6 opacity-0 animate-fade-in-up animate-fill-forwards animate-delay-100">
      {!hasData ? (
        <div
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragging
              ? 'border-primary-400 bg-primary-500/10 scale-[1.02]'
              : 'border-dark-600 hover:border-primary-500/50 hover:bg-dark-800/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.log,text/plain"
            onChange={handleFileChange}
            className="hidden"
          />

          {isLoading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 size={48} className="text-primary-400 animate-spin" />
              <p className="text-dark-300">正在解析文件...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center">
                  <Upload size={40} className="text-primary-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">
                  导入 Git 日志文件
                </h3>
                <p className="text-dark-400 max-w-md mx-auto">
                  拖拽文件到此处，或点击选择文件。支持 .txt 和 .log 格式
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6">
                <button
                  onClick={handleClick}
                  className="px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white rounded-xl font-medium transition-all duration-300 flex items-center gap-2 shadow-lg shadow-primary-500/25"
                >
                  <FileText size={18} />
                  选择文件
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLoadSample();
                  }}
                  className="px-6 py-3 bg-dark-800 hover:bg-dark-700 text-dark-200 rounded-xl font-medium transition-all duration-300 flex items-center gap-2 border border-dark-600"
                >
                  <Play size={18} />
                  加载示例数据
                </button>
              </div>

              <div className="mt-8 p-4 bg-dark-900/50 rounded-xl border border-dark-700">
                <p className="text-xs text-dark-500 mb-2">生成日志文件的命令：</p>
                <code className="text-sm text-primary-300 font-mono block bg-dark-950/50 px-3 py-2 rounded-lg">
                  git log --pretty=format:"%H|%an|%ae|%ad|%s" --numstat --date=iso &gt; gitlog.txt
                </code>
              </div>
            </>
          )}

          {error && (
            <div className="mt-4 p-4 bg-accent-500/10 border border-accent-500/30 rounded-xl text-accent-400 text-sm">
              {error}
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-white font-medium">
                {fileName || 'Git 日志数据'}
              </p>
              <p className="text-sm text-dark-400">
                已成功解析 <span className="text-primary-400 font-mono">{commits.length}</span> 条提交记录
              </p>
            </div>
          </div>
          <button
            onClick={clearData}
            className="p-2 rounded-lg hover:bg-dark-700 text-dark-400 hover:text-white transition-colors"
            title="清除数据"
          >
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  );
});
