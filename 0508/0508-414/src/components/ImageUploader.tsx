import React, { useRef, useState, useCallback } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';

interface ImageUploaderProps {
  onImageLoaded: (imageData: ImageData, width: number, height: number) => void;
  previewUrl?: string;
}

export default function ImageUploader({ onImageLoaded, previewUrl }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(previewUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.match('image/png') && !file.type.match('image/bmp')) {
      alert('请上传 PNG 或 BMP 格式的图片');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, img.width, img.height);
            onImageLoaded(imageData, img.width, img.height);
          }
        }
        setPreview(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [onImageLoaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleClear = useCallback(() => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageLoaded(new ImageData(1, 1), 0, 0);
  }, [onImageLoaded]);

  return (
    <div className="w-full">
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.bmp"
        onChange={handleInputChange}
        className="hidden"
      />
      
      {!preview ? (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`upload-zone rounded-2xl p-12 text-center cursor-pointer transition-all duration-300 ${
            isDragging ? 'dragover' : ''
          }`}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-accent-500/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-accent-400" />
            </div>
            <div>
              <p className="text-lg font-medium text-slate-200">拖拽图片到此处</p>
              <p className="text-sm text-slate-400 mt-1">或点击选择文件</p>
            </div>
            <p className="text-xs text-slate-500">支持 PNG、BMP 格式</p>
          </div>
        </div>
      ) : (
        <div className="relative group">
          <div className="rounded-2xl overflow-hidden border border-accent-500/30">
            <img
              src={preview}
              alt="Preview"
              className="w-full max-h-80 object-contain bg-slate-900/50"
            />
          </div>
          <button
            onClick={handleClear}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-red-500/90 hover:bg-red-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
      )}
    </div>
  );
}
