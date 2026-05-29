import { Copy, Check } from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
  text: string;
  className?: string;
  disabled?: boolean;
}

export const CopyButton = ({ text, className, disabled }: CopyButtonProps) => {
  const { copied, copy } = useCopyToClipboard();

  const handleCopy = async () => {
    if (text && !disabled) {
      await copy(text);
    }
  };

  return (
    <button
      onClick={handleCopy}
      disabled={disabled || !text}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
        'bg-sky-500 hover:bg-sky-600 text-white',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-sky-500',
        'focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900',
        'active:scale-95',
        copied && 'bg-emerald-500 hover:bg-emerald-500',
        className
      )}
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          <span>已复制</span>
        </>
      ) : (
        <>
          <Copy className="w-4 h-4" />
          <span>复制</span>
        </>
      )}
    </button>
  );
};
