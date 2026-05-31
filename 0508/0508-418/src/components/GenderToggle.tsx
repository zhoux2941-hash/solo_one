import { User, UserRound, Layers } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { Gender } from '@/types';

export const GenderToggle = () => {
  const { gender, setGender, overlayMode, setOverlayMode } = useAppStore();

  const options: { value: Gender; label: string; icon: typeof User }[] = [
    { value: 'male', label: '男声', icon: User },
    { value: 'female', label: '女声', icon: UserRound },
  ];

  return (
    <div className="w-full space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-400 mb-2">
          语音性别
        </label>
        <div className="flex bg-slate-800/50 rounded-xl p-1 border border-slate-700">
          {options.map((option) => {
            const isActive = gender === option.value;
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                onClick={() => setGender(option.value)}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-sky-500 to-cyan-500 text-white shadow-lg shadow-sky-500/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <Icon size={18} className={isActive ? 'animate-pulse' : ''} />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
        {gender === 'female' && (
          <p className="mt-2 text-xs text-slate-500 text-center">
            女声共振峰频率比男声高约20%
          </p>
        )}
      </div>

      <div className="pt-2 border-t border-slate-700/50">
        <label className="flex items-center gap-3 cursor-pointer group">
          <div className="relative">
            <input
              type="checkbox"
              checked={overlayMode}
              onChange={(e) => setOverlayMode(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`relative w-10 h-6 rounded-full transition-all duration-300 ${
                overlayMode
                  ? 'bg-gradient-to-r from-violet-500 to-purple-500'
                  : 'bg-slate-700'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                  overlayMode ? 'translate-x-4' : ''
                }`}
                style={{ left: '2px' }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Layers
              size={16}
              className={`transition-colors duration-300 ${
                overlayMode ? 'text-violet-400' : 'text-slate-500'
              }`}
            />
            <span
              className={`text-sm font-medium transition-colors duration-300 ${
                overlayMode ? 'text-white' : 'text-slate-400'
              }`}
            >
              叠加模式
            </span>
          </div>
        </label>
        <p className="mt-1.5 text-xs text-slate-500 ml-12">
          勾选后切换元音时保留历史点，不同颜色区分
        </p>
      </div>
    </div>
  );
};
