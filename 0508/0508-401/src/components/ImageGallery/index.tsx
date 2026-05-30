import React, { useState } from 'react';
import { RepresentativeWork } from '../../types';
import ImageModal from './ImageModal';
import { ZoomIn } from 'lucide-react';

interface ImageGalleryProps {
  images: RepresentativeWork[];
}

const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const openModal = (index: number) => {
    setCurrentImageIndex(index);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
  };

  const goToPrev = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="mt-6">
      <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="w-1 h-5 bg-red-700 rounded-full"></span>
        代表作欣赏
      </h4>
      
      <div className="grid grid-cols-2 gap-3">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="relative group cursor-pointer rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300"
            onClick={() => openModal(index)}
          >
            <div className="aspect-square overflow-hidden">
              <img
                src={image.imageUrl}
                alt={image.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <p className="text-white text-sm font-medium truncate">{image.title}</p>
                <p className="text-amber-300 text-xs mt-1">{image.theme}</p>
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full">
                  <ZoomIn className="text-white" size={24} />
                </div>
              </div>
            </div>

            <div className="absolute top-2 right-2">
              <span className="bg-red-700/90 text-white text-xs px-2 py-1 rounded-full">
                {image.theme}
              </span>
            </div>
          </div>
        ))}
      </div>

      <ImageModal
        isOpen={modalOpen}
        onClose={closeModal}
        images={images}
        currentIndex={currentImageIndex}
        onPrev={goToPrev}
        onNext={goToNext}
      />
    </div>
  );
};

export default ImageGallery;
