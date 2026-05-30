import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalButton {
  text: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

interface ModalProps {
  isOpen: boolean;
  title?: string;
  children: React.ReactNode;
  buttons?: ModalButton[];
  onClose: () => void;
  closeOnOverlayClick?: boolean;
  showCloseButton?: boolean;
  maxWidth?: string;
}

export default function Modal({
  isOpen,
  title,
  children,
  buttons,
  onClose,
  closeOnOverlayClick = true,
  showCloseButton = true,
  maxWidth = 'max-w-lg',
}: ModalProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  };

  const getButtonVariant = (variant?: string) => {
    switch (variant) {
      case 'primary':
        return 'bg-embroidery-red text-ivory hover:bg-embroidery-red/90';
      case 'secondary':
        return 'bg-indigo-batik text-ivory hover:bg-indigo-batik/90';
      case 'danger':
        return 'bg-red-600 text-white hover:bg-red-700';
      default:
        return 'bg-ivory text-indigo-batik border-2 border-indigo-batik hover:bg-indigo-batik/10';
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={handleOverlayClick}
    >
      <div
        className={cn(
          'relative w-full',
          maxWidth,
          'bg-ivory rounded-lg shadow-batik animate-fade-in-up',
          'border-4 border-embroidery-red'
        )}
        style={{
          borderImage: `repeating-linear-gradient(
            45deg,
            #C41E3A,
            #C41E3A 8px,
            #D4AF37 8px,
            #D4AF37 16px
          ) 4`,
        }}
      >
        <div className="absolute inset-0 bg-batik-pattern opacity-30 pointer-events-none rounded-lg" />

        {title && (
          <div className="relative px-6 py-4 border-b-2 border-gold/30">
            <h2 className="text-2xl font-ma-shan text-gradient-indigo text-center pr-8">
              {title}
            </h2>
            {showCloseButton && (
              <button
                onClick={onClose}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-embroidery-red/10 transition-colors text-indigo-batik hover:text-embroidery-red"
              >
                <X size={24} />
              </button>
            )}
          </div>
        )}

        {!title && showCloseButton && (
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 p-2 rounded-full hover:bg-embroidery-red/10 transition-colors text-indigo-batik hover:text-embroidery-red"
          >
            <X size={24} />
          </button>
        )}

        <div className="relative px-6 py-4 max-h-[60vh] overflow-y-auto">
          {children}
        </div>

        {buttons && buttons.length > 0 && (
          <div className="relative px-6 py-4 border-t-2 border-gold/30 flex justify-end gap-3">
            {buttons.map((button, index) => (
              <button
                key={index}
                onClick={button.onClick}
                disabled={button.disabled}
                className={cn(
                  'px-6 py-2 rounded-md font-medium transition-all duration-200',
                  'hover:scale-105 active:scale-95',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
                  getButtonVariant(button.variant)
                )}
              >
                {button.text}
              </button>
            ))}
          </div>
        )}

        <div className="absolute -top-1 -left-1 w-4 h-4 bg-embroidery-red rounded-full" />
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-embroidery-red rounded-full" />
        <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-embroidery-red rounded-full" />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-embroidery-red rounded-full" />
      </div>
    </div>
  );
}
