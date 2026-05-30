import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload as UploadIcon, Plus, Trash2, Check, Loader2, Palette } from 'lucide-react';
import { uploadImage, getTempPatterns, deleteTempPattern, type Pattern } from '@/utils/api';
export default function Upload() {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<Pattern | null>(null);
  const [tempPatterns, setTempPatterns] = useState<Pattern[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    loadTempPatterns();
  }, []);
  const loadTempPatterns = async () => {
    try {
      const patterns = await getTempPatterns();
      setTempPatterns(patterns);
    } catch (error) {
      console.error('Failed to load temp patterns:', error);
    }
  };
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
      processFile(files[0]);
    }
  }, []);
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };
  const processFile = async (file: File) => {
    if (!file.type.startsWith('image/') && file.type !== 'image/svg+xml') {
      alert('请上传图片文件（PNG, JPG, SVG）');
      return;
    }
    setIsUploading(true);
    setUploadResult(null);
    try {
      const result = await uploadImage(file);
      if (result) {
        setUploadResult(result);
        loadTempPatterns();
      } else {
        alert('上传失败，请重试');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('上传失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };
  const handleAddToEditor = (pattern: Pattern) => {
    navigate(`/editor?pattern=${pattern.id}`);
  };
  const handleDelete = async (id: number) => {
    if (confirm('确定要删除这个纹样吗？')) {
      try {
        await deleteTempPattern(id);
        loadTempPatterns();
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };
  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#1A2332] mb-2">上传纹样</h2>
          <p className="text-[#1A2332]/70">上传您的纹样图片，系统将自动提取轮廓并存入临时库</p>
        </div>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragging
              ? 'border-[#D4A84B] bg-[#D4A84B]/10'
              : 'border-[#1A2332]/20 bg-white hover:border-[#D4A84B] hover:bg-[#D4A84B]/5'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
            onChange={handleFileSelect}
            className="hidden"
          />
          {isUploading ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-16 h-16 text-[#D4A84B] animate-spin" />
              <p className="text-lg text-[#1A2332]/70">正在提取轮廓...</p>
            </div>
          ) : (
            <>
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#1A2332]/5 flex items-center justify-center">
                <UploadIcon className="w-10 h-10 text-[#1A2332]/50" />
              </div>
              <p className="text-lg text-[#1A2332] font-medium mb-2">
                拖拽图片到这里，或点击选择文件
              </p>
              <p className="text-sm text-[#1A2332]/50">
                支持 PNG, JPG, SVG 格式，最大 5MB
              </p>
            </>
          )}
        </div>
        {uploadResult && (
          <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-[#1A2332]">轮廓提取完成</h3>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-[#1A2332]/70 mb-2">原图</p>
                <div className="aspect-square bg-[#F5F0E8] rounded-xl flex items-center justify-center overflow-hidden">
                  {uploadResult.thumbnail ? (
                    <img
                      src={uploadResult.thumbnail}
                      alt="原图"
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <Palette className="w-16 h-16 text-[#1A2332]/20" />
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-[#1A2332]/70 mb-2">提取的轮廓</p>
                <div className="aspect-square bg-[#F5F0E8] rounded-xl flex items-center justify-center">
                  <svg
                    viewBox="0 0 100 100"
                    className="w-3/4 h-3/4"
                    style={{
                      fill: 'none',
                      stroke: '#1A2332',
                      strokeWidth: 2,
                    }}
                  >
                    <path d={uploadResult.svg_path} />
                  </svg>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setUploadResult(null)}
                className="px-6 py-2 rounded-lg border border-[#1A2332]/20 text-[#1A2332]/70 hover:bg-[#1A2332]/5 transition-colors"
              >
                继续上传
              </button>
              <button
                onClick={() => handleAddToEditor(uploadResult)}
                className="flex items-center gap-2 px-6 py-2 bg-[#D4A84B] text-[#1A2332] rounded-lg hover:bg-[#D4A84B]/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                添加到工作台
              </button>
            </div>
          </div>
        )}
        {tempPatterns.length > 0 && (
          <div className="mt-12">
            <h3 className="text-xl font-bold text-[#1A2332] mb-4">临时纹样库</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {tempPatterns.map((pattern) => (
                <div
                  key={pattern.id}
                  className="bg-white rounded-xl p-4 shadow-sm group relative"
                >
                  <button
                    onClick={() => handleDelete(pattern.id)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="aspect-square bg-[#F5F0E8] rounded-lg mb-3 flex items-center justify-center">
                    <svg
                      viewBox="0 0 100 100"
                      className="w-3/4 h-3/4"
                      style={{
                        fill: 'none',
                        stroke: '#1A2332',
                        strokeWidth: 2,
                      }}
                    >
                      <path d={pattern.svg_path} />
                    </svg>
                  </div>
                  <p className="text-sm text-[#1A2332] font-medium mb-2 truncate">
                    {pattern.name}
                  </p>
                  <button
                    onClick={() => handleAddToEditor(pattern)}
                    className="w-full flex items-center justify-center gap-1 py-1.5 bg-[#1A2332] text-white text-sm rounded-lg hover:bg-[#1A2332]/90 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    添加
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
