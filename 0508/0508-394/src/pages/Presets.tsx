import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDougongStore } from '@/store/useDougongStore';
import { ArrowLeft, Building2, MapPin } from 'lucide-react';

const Presets: React.FC = () => {
  const presets = useDougongStore((s) => s.presets);
  const loadPreset = useDougongStore((s) => s.loadPreset);
  const navigate = useNavigate();

  const handleLoad = (preset: typeof presets[0]) => {
    loadPreset(preset);
    navigate('/');
  };

  const dynastyColors: Record<string, string> = {
    '宋': 'from-[#8D6E63] to-[#6D4C41]',
    '清': 'from-[#C62828] to-[#8E0000]',
  };

  return (
    <div className="min-h-screen bg-[#1A1210] text-[#F5F0E8]">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#3E2723] border border-[#5D4037] text-[#F5F0E8] text-sm hover:border-[#D4A843] transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            返回设计
          </button>
          <h1 className="text-2xl font-serif text-[#D4A843]">经典实例库</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {presets.map((preset) => (
            <div
              key={preset.id}
              className="bg-[#2C1B0E]/90 backdrop-blur rounded-xl border border-[#5D4037]/50 overflow-hidden hover:border-[#D4A843]/60 transition-all hover:shadow-lg hover:shadow-[#D4A843]/10 group"
            >
              <div className={`h-32 bg-gradient-to-br ${dynastyColors[preset.dynasty] || ''} flex items-center justify-center relative`}>
                <Building2 className="w-16 h-16 text-white/20 group-hover:text-white/30 transition-colors" />
                <div className="absolute top-3 left-3 flex items-center gap-1 px-2 py-0.5 bg-black/30 rounded-full text-xs">
                  <MapPin className="w-3 h-3" />
                  {preset.dynasty}式
                </div>
                <div className="absolute top-3 right-3 px-2 py-0.5 bg-black/30 rounded-full text-xs">
                  {preset.grade}等材 · {preset.jumps}跳
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-serif text-lg text-[#F5F0E8] mb-2">{preset.name}</h3>
                <p className="text-xs text-[#8D6E63] leading-relaxed mb-4">{preset.description}</p>
                <button
                  onClick={() => handleLoad(preset)}
                  className="w-full py-2 rounded-lg bg-[#C62828] text-white text-sm font-medium hover:bg-[#B71C1C] transition-colors"
                >
                  加载参数
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Presets;
