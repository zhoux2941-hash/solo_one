import { useState, useEffect } from 'react';
import { MousePointerClick, X } from 'lucide-react';

export default function Tips() {
  const [show, setShow] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const timer = setTimeout(() => {
      setShow(false);
    }, 8000);
    return () => clearTimeout(timer);
  }, [dismissed]);

  const handleDismiss = () => {
    setDismissed(true);
    setShow(false);
  };

  if (!show || dismissed) return null;

  return (
    <div
      className="absolute top-4 right-4 z-10 flex items-center gap-3 px-4 py-3 rounded-xl animate-fade-up"
      style={{
        background: 'rgba(10,14,23,0.85)',
        border: '1px solid rgba(245,230,200,0.1)',
        backdropFilter: 'blur(10px)',
        animationDelay: '2s',
      }}
    >
      <MousePointerClick size={16} style={{ color: 'rgba(245,230,200,0.6)' }} />
      <div className="flex flex-col">
        <span
          className="text-[11px] font-semibold"
          style={{
            color: 'rgba(245,230,200,0.7)',
            fontFamily: "'Noto Sans SC', sans-serif",
          }}
        >
          操作提示
        </span>
        <span
          className="text-[10px]"
          style={{
            color: 'rgba(245,230,200,0.4)',
            fontFamily: "'Noto Sans SC', sans-serif",
          }}
        >
          点击发明查看路线 · 点击节点查看详情
        </span>
      </div>
      <button
        onClick={handleDismiss}
        className="ml-2 p-1 rounded hover:bg-white/5 transition-colors"
        style={{ color: 'rgba(245,230,200,0.3)' }}
      >
        <X size={12} />
      </button>
    </div>
  );
}
