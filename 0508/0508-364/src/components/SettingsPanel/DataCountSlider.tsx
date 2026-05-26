import { useAppStore } from '../../store/useAppStore';

const quickOptions = [1, 10, 50, 100, 500, 1000];

export function DataCountSlider() {
  const { dataCount, setDataCount } = useAppStore();

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-200">生成数量</h3>
        <span className="text-lg font-bold text-cyan-400">{dataCount}</span>
      </div>
      
      <input
        type="range"
        min={1}
        max={1000}
        value={dataCount}
        onChange={(e) => setDataCount(Number(e.target.value))}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 mb-4"
      />

      <div className="flex flex-wrap gap-2">
        {quickOptions.map((option) => (
          <button
            key={option}
            onClick={() => setDataCount(option)}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${
              dataCount === option
                ? 'bg-cyan-500 text-white'
                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
