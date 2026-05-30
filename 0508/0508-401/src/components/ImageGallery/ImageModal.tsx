import React, { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { RepresentativeWork } from '../../types';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: RepresentativeWork[];
  currentIndex: number;
  onPrev: () => void;
  onNext: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({
  isOpen,
  onClose,
  images,
  currentIndex,
  onPrev,
  onNext
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onPrev, onNext]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10"
      >
        <X size={32} />
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onPrev(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10"
          >
            <ChevronLeft size={40} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 text-white/80 hover:text-white transition-colors rounded-full hover:bg-white/10"
          >
            <ChevronRight size={40} />
          </button>
        </>
      )}

      <div
        className="relative max-w-5xl max-h-[90vh] mx-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative group">
          <img
            src={currentImage.imageUrl}
            alt={currentImage.title}
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
          />
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-black/50 text-white px-3 py-1.5 rounded-full text-sm">
            <ZoomIn size={16} />
            <span>点击放大查看细节</span>
          </div>
        </div>

        <div className="mt-4 text-center">
          <h3 className="text-white text-xl font-semibold">{currentImage.title}</h3>
          <p className="text-amber-300 text-sm mt-1">主题：{currentImage.theme}</p>
          <p className="text-white/60 text-sm mt-2">
            {currentIndex + 1} / {images.length}
          </p>
        </div>

        {images.length > 1 && (
          <div className="mt-6 flex justify-center gap-2 flex-wrap">
            {images.map((image, index) => (
              <button
                key={image.id}
                onClick={() => {}}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-amber-400 scale-110'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <img
                  src={image.imageUrl}
                  alt={image.title}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageModal;
