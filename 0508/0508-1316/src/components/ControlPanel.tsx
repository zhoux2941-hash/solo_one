import React from 'react';
import { Play, RotateCcw, Download, Scroll } from 'lucide-react';
import { useSlipsStore } from '../store/useSlipsStore';
import { exportAsImage } from '../utils/exportImage';
import { cn } from '../utils/cn';

export const ControlPanel: React.FC = () => {
  const { slipCount, setSlipCount, isStarted, startSimulation, reset } = useSlipsStore();

  const handleExport = async () => {
    await exportAsImage('bamboo-workspace', 'bamboo-slips-编联结果.png');
  };

  return (
    <div className="w-64 bg-gradient-to-b from-stone-800 to-stone-900 p-6 rounded-r-xl shadow-2xl">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-red-700 to-red-900 rounded-lg flex items-center justify-center shadow-lg">
          <Scroll className="w-6 h-6 text-amber-100" />
        </div>
        <div>
          <h2 className="text-amber-100 font-bold text-lg">竹简编联</h2>
          <p className="text-amber-400 text-xs">郭店楚简模拟</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-amber-200 text-sm font-medium flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-500 rounded-full" />
            竹简数量
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min="5"
              max="20"
              value={slipCount}
              onChange={(e) => setSlipCount(Number(e.target.value))}
              disabled={isStarted}
              className="flex-1 h-2 bg-stone-700 rounded-lg appearance-none cursor-pointer accent-amber-500 disabled:opacity-50"
            />
            <span className="text-amber-100 font-bold text-lg w-8 text-center">
              {slipCount}
            </span>
          </div>
          <div className="flex justify-between text-stone-500 text-xs">
            <span>5</span>
            <span>20</span>
          </div>
        </div>

        <div className="space-y-3">
          {!isStarted ? (
            <button
              onClick={startSimulation}
              className={cn(
                'w-full py-3 px-4 rounded-lg font-bold text-lg',
                'bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600',
                'text-amber-50 shadow-lg hover:shadow-xl',
                'transform hover:-translate-y-0.5 transition-all duration-200',
                'flex items-center justify-center gap-2'
              )}
            >
              <Play className="w-5 h-5" />
              开始模拟
            </button>
          ) : (
            <>
              <button
                onClick={reset}
                className={cn(
                  'w-full py-3 px-4 rounded-lg font-bold',
                  'bg-stone-700 hover:bg-stone-600',
                  'text-amber-100 shadow-md hover:shadow-lg',
                  'transform hover:-translate-y-0.5 transition-all duration-200',
                  'flex items-center justify-center gap-2'
                )}
              >
                <RotateCcw className="w-5 h-5" />
                重新开始
              </button>

              <button
                onClick={handleExport}
                className={cn(
                  'w-full py-3 px-4 rounded-lg font-bold',
                  'bg-gradient-to-r from-green-700 to-green-800 hover:from-green-600 hover:to-green-700',
                  'text-green-50 shadow-md hover:shadow-lg',
                  'transform hover:-translate-y-0.5 transition-all duration-200',
                  'flex items-center justify-center gap-2'
                )}
              >
                <Download className="w-5 h-5" />
                导出结果图
              </button>
            </>
          )}
        </div>

        <div className="pt-6 border-t border-stone-700">
          <h3 className="text-amber-300 text-sm font-bold mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
            操作说明
          </h3>
          <ul className="space-y-2 text-stone-400 text-xs">
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              拖拽竹简可调整顺序
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              点击竹简查看文字释读
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              点击翻转按钮查看背面
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">•</span>
              圆点表示编绳孔对齐状态
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              方块表示边缘纹理匹配度
            </li>
          </ul>
        </div>

        <div className="pt-4">
          <div className="bg-blue-900 bg-opacity-30 rounded-lg p-4 border border-blue-700 border-opacity-30">
            <p className="text-blue-300 text-xs font-medium mb-1">💡 智能检测</p>
            <p className="text-stone-400 text-xs leading-relaxed">
              系统综合检测：编绳孔位置对齐 + 竹简边缘纹理特征匹配，双重验证确保编联准确性。
            </p>
          </div>
        </div>

        <div className="pt-4">
          <div className="bg-stone-700 bg-opacity-50 rounded-lg p-4">
            <p className="text-amber-400 text-xs font-medium mb-1">关于郭店楚简</p>
            <p className="text-stone-400 text-xs leading-relaxed">
              1993年出土于湖北荆门郭店一号楚墓，为先秦时期的竹简典籍，包含《老子》《太一生水》等珍贵文献。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
