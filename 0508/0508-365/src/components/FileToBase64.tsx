import { useState, useCallback, useRef, useMemo } from 'react';
import { Upload, FileImage, FileText, X, File, Eye, EyeOff } from 'lucide-react';
import { CopyButton } from './CopyButton';
import { Base64Service } from '@/services/Base64Service';
import { cn } from '@/lib/utils';

const PREVIEW_LIMIT = 100;

export const FileToBase64 = () => {
  const [file, setFile] = useState<File | null>(null);
  const [base64, setBase64] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFullContent, setShowFullContent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const needsPreview = useMemo(() => base64.length > PREVIEW_LIMIT, [base64]);

  const displayBase64 = useMemo(() => {
    if (!needsPreview || showFullContent) return base64;
    return base64.slice(0, PREVIEW_LIMIT) + '...';
  }, [base64, needsPreview, showFullContent]);

  const processFile = useCallback(async (selectedFile: File) => {
    setIsLoading(true);
    setError(null);
    setShowFullContent(false);
    try {
      const result = await Base64Service.fromFile(selectedFile);
      setFile(selectedFile);
      setBase64(result);
    } catch (err) {
      setError('文件读取失败：' + (err as Error).message);
      setFile(null);
      setBase64('');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      processFile(selectedFile);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      processFile(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const clearFile = () => {
    setFile(null);
    setBase64('');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = () => {
    if (!file) return <File className="w-8 h-8" />;
    if (file.type.startsWith('image/')) {
      return <FileImage className="w-8 h-8 text-pink-400" />;
    }
    if (file.type === 'application/pdf') {
      return <FileText className="w-8 h-8 text-red-400" />;
    }
    return <File className="w-8 h-8 text-slate-400" />;
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden shadow-xl hover:shadow-2xl transition-shadow duration-300">
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl shadow-lg shadow-emerald-500/25">
            <Upload className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">文件 → Base64</h2>
            <p className="text-slate-400 text-sm">上传图片或PDF文件</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            'relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300',
            'hover:border-sky-500/50 hover:bg-sky-500/5',
            isDragging
              ? 'border-sky-500 bg-sky-500/10 scale-[1.02]'
              : 'border-slate-600/50 bg-slate-900/30',
            isLoading && 'opacity-50 cursor-wait'
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {isLoading ? (
            <div className="space-y-3">
              <div className="w-12 h-12 mx-auto rounded-full border-4 border-sky-500/30 border-t-sky-500 animate-spin" />
              <p className="text-slate-300">正在处理文件...</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-sky-500/20 to-cyan-500/20 flex items-center justify-center">
                <Upload className="w-8 h-8 text-sky-400" />
              </div>
              <div>
                <p className="text-slate-200 font-medium">点击或拖拽文件到这里</p>
                <p className="text-slate-400 text-sm mt-1">支持 JPG、PNG、GIF、PDF 等格式</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {file && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-lg">
                  {getFileIcon()}
                </div>
                <div>
                  <p className="text-white font-medium truncate max-w-[200px]">{file.name}</p>
                  <p className="text-slate-400 text-sm">
                    {file.type || '未知类型'} · {Base64Service.formatFileSize(file.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={clearFile}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                title="移除文件"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-slate-300">Base64 结果</label>
                  {needsPreview && (
                    <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-0.5 rounded">
                      {base64.length} 字符
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {needsPreview && (
                    <button
                      onClick={() => setShowFullContent(!showFullContent)}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-all"
                      title={showFullContent ? '折叠显示' : '显示全部'}
                    >
                      {showFullContent ? (
                        <><EyeOff className="w-3 h-3" /> 折叠</>
                      ) : (
                        <><Eye className="w-3 h-3" /> 显示全部</>
                      )}
                    </button>
                  )}
                  <CopyButton text={base64} />
                </div>
              </div>
              <textarea
                value={displayBase64}
                readOnly
                placeholder="Base64 字符串将显示在这里..."
                className={cn(
                  "w-full h-32 px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-600/50 text-slate-300 placeholder-slate-500 font-mono text-xs resize-none focus:outline-none",
                  !showFullContent && needsPreview && 'text-emerald-400'
                )}
              />
            </div>

            <div className="text-xs text-slate-500">
              结果包含 data: 前缀，可直接用于 &lt;img src="..." /&gt; 标签
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
