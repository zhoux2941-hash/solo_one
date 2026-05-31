export default function Header() {
  return (
    <header
      className="relative flex items-center justify-center py-4 px-6"
      style={{
        background: 'linear-gradient(180deg, rgba(10,14,23,0.9) 0%, transparent 100%)',
        borderBottom: '1px solid rgba(245,230,200,0.06)',
      }}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute top-0 left-1/4 w-32 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(232,168,56,0.3), transparent)',
          }}
        />
        <div
          className="absolute top-0 right-1/4 w-32 h-px"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(232,168,56,0.3), transparent)',
          }}
        />
      </div>
      <div className="text-center">
        <h1
          className="text-2xl font-bold tracking-[0.3em] mb-0.5 animate-title"
          style={{
            color: 'rgba(245,230,200,0.9)',
            fontFamily: "'Noto Serif SC', serif",
            textShadow: '0 0 30px rgba(232,168,56,0.2)',
          }}
        >
          四大发明 · 世界传播图
        </h1>
        <p
          className="text-xs tracking-[0.2em] animate-fade-up"
          style={{
            animationDelay: '0.3s',
            color: 'rgba(245,230,200,0.35)',
            fontFamily: "'Noto Sans SC', sans-serif",
          }}
        >
          中国古代科技向世界传播的交互式地图
        </p>
      </div>
    </header>
  );
}
