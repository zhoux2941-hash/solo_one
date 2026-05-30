import { useState } from 'react';
import { Flame, RotateCcw, Sparkles, ArrowUpDown, ChevronDown, ChevronUp, Waves, MoveHorizontal, Minus } from 'lucide-react';
import { useDivinationStore } from '@/stores/divinationStore';
import type { ShellType, PitShape } from '@/types';

const shellOptions: { value: ShellType; label: string }[] = [
  { value: 'plastron', label: '腹甲' },
  { value: 'carapace', label: '背甲' },
];

const pitOptions: { value: PitShape; label: string }[] = [
  { value: 'circle', label: '圆形' },
  { value: 'jujube', label: '枣核形' },
];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, #8B6914, transparent)' }} />
      <span className="text-xs tracking-widest uppercase" style={{ color: '#d4a843' }}>{children}</span>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, #8B6914, transparent)' }} />
    </div>
  );
}

function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-2">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="flex-1 py-1.5 rounded text-sm transition-all duration-200"
            style={{
              background: active ? '#8B6914' : 'transparent',
              color: active ? '#1a1208' : '#d4a843',
              border: active ? '1px solid #8B6914' : '1px solid #5c4a3a55',
              boxShadow: active ? '0 0 8px #8B691466' : 'none',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default function ControlPanel() {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const {
    shellType,
    pitShape,
    temperature,
    anisotropyRatio,
    mediumKv,
    mediumKh,
    mediumKd,
    isCracking,
    setShellType,
    setPitShape,
    setTemperature,
    setAnisotropyRatio,
    setMediumKv,
    setMediumKh,
    setMediumKd,
    generateCracks,
    resetDivination,
  } = useDivinationStore();

  return (
    <div
      className="w-64 p-4 flex flex-col gap-5 rounded-lg"
      style={{ background: '#1a1208cc', border: '1px solid #5c4a3a44' }}
    >
      <div>
        <SectionTitle>龟甲部位</SectionTitle>
        <ToggleGroup options={shellOptions} value={shellType} onChange={setShellType} />
      </div>

      <div>
        <SectionTitle>凿坑形状</SectionTitle>
        <ToggleGroup options={pitOptions} value={pitShape} onChange={setPitShape} />
      </div>

      <div>
        <SectionTitle>灼烧温度</SectionTitle>
        <div className="flex items-center gap-2 mb-1">
          <Flame size={14} style={{ color: '#d4a843' }} />
          <span className="text-sm" style={{ color: '#d4a843' }}>{temperature}℃</span>
        </div>
        <input
          type="range"
          min={500}
          max={1200}
          step={10}
          value={temperature}
          onChange={(e) => setTemperature(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #e8a830, #d45e20, #a01010)`,
          }}
        />
        <style>{`
          input[type=range]::-webkit-slider-thumb {
            -webkit-appearance: none;
            width: 16px; height: 16px;
            border-radius: 50%;
            background: #d4a843;
            border: 2px solid #8B6914;
            box-shadow: 0 0 6px #8B691488;
          }
          input[type=range]::-moz-range-thumb {
            width: 16px; height: 16px;
            border-radius: 50%;
            background: #d4a843;
            border: 2px solid #8B6914;
            box-shadow: 0 0 6px #8B691488;
          }
        `}</style>
      </div>

      <div>
        <SectionTitle>纵/横比</SectionTitle>
        <div className="flex items-center gap-2 mb-1">
          <ArrowUpDown size={14} style={{ color: '#d4a843' }} />
          <span className="text-sm" style={{ color: '#d4a843' }}>{anisotropyRatio.toFixed(1)}</span>
          <span className="text-xs ml-auto" style={{ color: '#8b7355' }}>
            {anisotropyRatio > 1 ? '纵向占优' : anisotropyRatio < 1 ? '横向占优' : '各向同性'}
          </span>
        </div>
        <input
          type="range"
          min={0.3}
          max={4.0}
          step={0.1}
          value={anisotropyRatio}
          onChange={(e) => setAnisotropyRatio(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #3a5a8a, #8B6914, #8a3a5a)`,
          }}
        />
        <div className="flex justify-between text-xs mt-1" style={{ color: '#8b7355' }}>
          <span>横</span>
          <span>各向同性</span>
          <span>纵</span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-1">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, #8B6914, transparent)' }} />
            <span className="text-xs tracking-widest uppercase whitespace-nowrap" style={{ color: '#d4a843' }}>介质各向异性</span>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(to right, transparent, #8B6914, transparent)' }} />
          </div>
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="p-1 rounded transition-colors ml-2"
            style={{ color: '#d4a843' }}
          >
            {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {showAdvanced && (
          <div className="space-y-3 mt-2 pl-1">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Waves size={12} style={{ color: '#8a3a5a' }} />
                <span className="text-xs" style={{ color: '#d4a843' }}>纵向传导 Kv</span>
                <span className="text-xs ml-auto" style={{ color: '#8b7355' }}>{mediumKv.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={0.3}
                max={3.0}
                step={0.1}
                value={mediumKv}
                onChange={(e) => setMediumKv(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ background: 'linear-gradient(to right, #1a2a4a, #8a3a5a)' }}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <MoveHorizontal size={12} style={{ color: '#3a5a8a' }} />
                <span className="text-xs" style={{ color: '#d4a843' }}>横向传导 Kh</span>
                <span className="text-xs ml-auto" style={{ color: '#8b7355' }}>{mediumKh.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={0.3}
                max={3.0}
                step={0.1}
                value={mediumKh}
                onChange={(e) => setMediumKh(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ background: 'linear-gradient(to right, #1a2a4a, #3a5a8a)' }}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Minus size={12} style={{ color: '#3a8a5a', transform: 'rotate(45deg)' }} />
                <span className="text-xs" style={{ color: '#d4a843' }}>对角传导 Kd</span>
                <span className="text-xs ml-auto" style={{ color: '#8b7355' }}>{mediumKd.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={0.3}
                max={3.0}
                step={0.1}
                value={mediumKd}
                onChange={(e) => setMediumKd(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ background: 'linear-gradient(to right, #1a2a4a, #3a8a5a)' }}
              />
            </div>

            <p className="text-xs pt-1 border-t border-[#5c4a3a33]" style={{ color: '#6b5a40' }}>
              调节不同方向的应力传导系数，模拟真实龟甲的各向异性介质特性
            </p>
          </div>
        )}
      </div>

      <button
        onClick={generateCracks}
        disabled={isCracking}
        className="w-full py-3 rounded-lg text-base font-bold flex items-center justify-center gap-2 transition-all duration-300"
        style={{
          background: isCracking ? '#5c3a1a' : 'linear-gradient(135deg, #8B6914, #6b4c10)',
          color: isCracking ? '#d4a84388' : '#1a1208',
          border: '1px solid #8B6914',
          boxShadow: isCracking
            ? '0 0 20px #ff660066, 0 0 40px #ff330044'
            : '0 0 8px #8B691444',
          animation: isCracking ? 'pulse-glow 0.8s ease-in-out infinite' : 'none',
          cursor: isCracking ? 'not-allowed' : 'pointer',
        }}
      >
        <Sparkles size={18} />
        {isCracking ? '占卜中...' : '灼烧占卜'}
      </button>

      <style>{`
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px #ff660066, 0 0 40px #ff330044; }
          50% { box-shadow: 0 0 30px #ff880088, 0 0 60px #ff440066; }
        }
      `}</style>

      <button
        onClick={resetDivination}
        className="w-full py-1.5 rounded text-sm flex items-center justify-center gap-1.5 transition-all duration-200 hover:opacity-80"
        style={{
          background: 'transparent',
          color: '#d4a843',
          border: '1px solid #5c4a3a66',
        }}
      >
        <RotateCcw size={13} />
        重置
      </button>
    </div>
  );
}
