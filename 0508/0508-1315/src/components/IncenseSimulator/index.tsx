import React from 'react';
import { useIncenseStore } from '../../store/useIncenseStore';
import { AshCanvas } from '../AshCanvas';
import { getGrindLabel, getGrindDescription } from '../../utils/incenseSimulator';
import { Flame, Snowflake, Thermometer, Gauge, Clock, Play, Pause, RotateCcw, Sparkles } from 'lucide-react';

export const IncenseSimulator: React.FC = () => {
  const { incenseState, setTemperature, setGrindLevel, startBurning, stopBurning, resetBurning } = useIncenseStore();

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTemperatureColor = (temp: number): string => {
    if (temp < 140) return 'text-sky-500';
    if (temp < 160) return 'text-emerald-500';
    if (temp < 180) return 'text-amber-500';
    return 'text-red-500';
  };

  const getTemperatureAdvice = (temp: number): string => {
    if (temp < 140) return '温度偏低，香气散发较慢';
    if (temp < 160) return '温度适宜，香气清雅持久';
    if (temp < 180) return '最佳温度区间，出香率最高';
    if (temp < 195) return '温度偏高，注意控制时间';
    return '温度过高，可能产生焦糊味';
  };

  const releaseRateColor = incenseState.releaseRate >= 80
    ? 'text-emerald-500'
    : incenseState.releaseRate >= 50
      ? 'text-amber-500'
      : 'text-stone-500';

  const tempMarks = [120, 140, 160, 180, 200];

  return (
    <div className="bg-gradient-to-br from-stone-900 to-stone-800 rounded-2xl overflow-hidden">
      <div className="bg-gradient-to-r from-amber-900 to-stone-900 p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-lg">
            <Flame className="text-amber-400" size={24} />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">隔火熏香</h3>
            <p className="text-stone-400 text-sm">古法熏香，温而不烈</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <div className={`w-80 h-40 bg-gradient-to-b from-stone-700 to-stone-800 
              rounded-3xl border-4 border-stone-600 shadow-2xl overflow-hidden
              transition-all duration-500
              ${incenseState.isBurning ? 'shadow-amber-500/20' : ''}`}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-32 h-16 
                bg-gradient-to-b from-stone-500 to-stone-600 rounded-t-full 
                border-2 border-stone-400 shadow-inner"
              >
                <div className="absolute inset-2 bg-gradient-to-b from-stone-400 to-stone-500 
                  rounded-t-full opacity-50" 
                />
              </div>

              {incenseState.isBurning && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-2 h-2 bg-amber-400 rounded-full animate-pulse"
                      style={{
                        left: `${(i - 2) * 15}px`,
                        animationDelay: `${i * 0.2}s`,
                        opacity: 0.6 + Math.random() * 0.4,
                      }}
                    />
                  ))}
                </div>
              )}

              <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
                <AshCanvas width={300} height={120} />
              </div>

              {incenseState.isBurning && (
                <>
                  <div className="absolute top-16 left-1/4 w-4 h-4 
                    bg-gradient-to-t from-orange-500 to-yellow-400 rounded-full 
                    animate-pulse blur-sm opacity-80"
                  />
                  <div className="absolute top-16 right-1/4 w-3 h-3 
                    bg-gradient-to-t from-orange-400 to-yellow-300 rounded-full 
                    animate-pulse blur-sm opacity-60"
                    style={{ animationDelay: '0.3s' }}
                  />
                </>
              )}
            </div>

            <div className="absolute -left-8 top-1/2 -translate-y-1/2 text-5xl opacity-30">
              𓆣
            </div>
            <div className="absolute -right-8 top-1/2 -translate-y-1/2 text-5xl opacity-30 scale-x-[-1]">
              𓆣
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-stone-800/50 rounded-xl p-4 text-center border border-stone-700">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Thermometer className={getTemperatureColor(incenseState.temperature)} size={20} />
              <span className={`text-2xl font-bold ${getTemperatureColor(incenseState.temperature)}`}>
                {incenseState.temperature}
              </span>
              <span className="text-stone-400">℃</span>
            </div>
            <p className="text-xs text-stone-500">炉温</p>
          </div>

          <div className="bg-stone-800/50 rounded-xl p-4 text-center border border-stone-700">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gauge className={releaseRateColor} size={20} />
              <span className={`text-2xl font-bold ${releaseRateColor}`}>
                {Math.round(incenseState.releaseRate)}
              </span>
              <span className="text-stone-400">%</span>
            </div>
            <p className="text-xs text-stone-500">出香率</p>
          </div>

          <div className="bg-stone-800/50 rounded-xl p-4 text-center border border-stone-700">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Clock className="text-stone-400" size={20} />
              <span className="text-2xl font-bold text-stone-300">
                {formatTime(incenseState.burnTime)}
              </span>
            </div>
            <p className="text-xs text-stone-500">燃烧时间</p>
          </div>
        </div>

        <div className="bg-stone-800/30 rounded-xl p-4 border border-stone-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-stone-400 flex items-center gap-2">
              <Snowflake size={16} />
              温度调节
              <Flame size={16} className="text-amber-500" />
            </span>
            <span className={`text-sm ${getTemperatureColor(incenseState.temperature)}`}>
              {getTemperatureAdvice(incenseState.temperature)}
            </span>
          </div>

          <div className="relative">
            <input
              type="range"
              min="120"
              max="200"
              value={incenseState.temperature}
              onChange={(e) => setTemperature(parseInt(e.target.value))}
              className="w-full h-3 bg-stone-700 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-6
                [&::-webkit-slider-thumb]:h-6
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-gradient-to-br
                [&::-webkit-slider-thumb]:from-amber-400
                [&::-webkit-slider-thumb]:to-orange-500
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:hover:scale-110"
              style={{
                background: `linear-gradient(to right, #0ea5e9 0%, #10b981 25%, #f59e0b 50%, #ef4444 100%)`,
              }}
            />
            <div className="flex justify-between mt-2 text-xs text-stone-500">
              {tempMarks.map((temp) => (
                <span key={temp} className={incenseState.temperature === temp ? 'text-amber-400 font-bold' : ''}>
                  {temp}℃
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-stone-800/30 rounded-xl p-4 border border-stone-700">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-stone-400 flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" />
              研磨度
              <span className="ml-2 px-2 py-0.5 bg-amber-500/20 rounded text-amber-400 font-medium">
                {getGrindLabel(incenseState.grindLevel)}
              </span>
            </span>
            <span className="text-xs text-stone-500">
              {incenseState.grindLevel}/10
            </span>
          </div>

          <p className="text-xs text-stone-400 mb-3">
            {getGrindDescription(incenseState.grindLevel)}
          </p>

          <div className="relative">
            <input
              type="range"
              min="1"
              max="10"
              value={incenseState.grindLevel}
              onChange={(e) => setGrindLevel(parseInt(e.target.value))}
              className="w-full h-3 bg-stone-700 rounded-full appearance-none cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-6
                [&::-webkit-slider-thumb]:h-6
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-gradient-to-br
                [&::-webkit-slider-thumb]:from-amber-400
                [&::-webkit-slider-thumb]:to-orange-500
                [&::-webkit-slider-thumb]:shadow-lg
                [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:transition-transform
                [&::-webkit-slider-thumb]:hover:scale-110"
              style={{
                background: `linear-gradient(to right, #78716c 0%, #a16207 50%, #ea580c 100%)`,
              }}
            />
            <div className="flex justify-between mt-2 text-xs text-stone-500">
              <span className={incenseState.grindLevel <= 2 ? 'text-amber-400' : ''}>粗粉</span>
              <span className={incenseState.grindLevel > 4 && incenseState.grindLevel <= 6 ? 'text-amber-400' : ''}>中粉</span>
              <span className={incenseState.grindLevel >= 9 ? 'text-amber-400' : ''}>细粉</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          {!incenseState.isBurning ? (
            <button
              onClick={startBurning}
              className="flex-1 flex items-center justify-center gap-2 py-3 
                bg-gradient-to-r from-amber-500 to-orange-500 text-white 
                rounded-xl font-medium hover:from-amber-600 hover:to-orange-600 
                transition-all shadow-lg hover:shadow-amber-500/30"
            >
              <Play size={20} />
              开始熏香
            </button>
          ) : (
            <button
              onClick={stopBurning}
              className="flex-1 flex items-center justify-center gap-2 py-3 
                bg-gradient-to-r from-stone-600 to-stone-700 text-white 
                rounded-xl font-medium hover:from-stone-500 hover:to-stone-600 
                transition-all"
            >
              <Pause size={20} />
              暂停熏香
            </button>
          )}

          <button
            onClick={resetBurning}
            className="px-6 py-3 bg-stone-700 text-stone-300 rounded-xl 
              hover:bg-stone-600 transition-colors"
          >
            <RotateCcw size={20} />
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-stone-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `rgb(${incenseState.ashColor.r}, ${incenseState.ashColor.g}, ${incenseState.ashColor.b})` }} />
            <span>香灰颜色</span>
          </div>
          <span>
            灰白 → 灰褐
          </span>
        </div>
      </div>
    </div>
  );
};
