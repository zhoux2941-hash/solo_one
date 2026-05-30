import React, { useMemo } from 'react';
import { GitBranch, Layers } from 'lucide-react';
import { useHanoiStore } from '../../store/useHanoiStore';
import { generateRecursionTree } from '../../utils/hanoiSolver';

export const RecursionTree: React.FC = () => {
  const { diskCount, currentStep, solutionSteps } = useHanoiStore();

  const recursionTree = useMemo(() => {
    return generateRecursionTree(diskCount);
  }, [diskCount]);

  const activeNodes = useMemo(() => {
    const totalMoves = solutionSteps.length;
    return recursionTree.map((node, index) => ({
      ...node,
      isActive: index < totalMoves && index <= currentStep,
      isCompleted: index < currentStep
    }));
  }, [recursionTree, currentStep, solutionSteps.length]);

  const maxDepth = Math.max(...recursionTree.map(n => n.depth));
  const currentDepth = currentStep > 0 ? Math.floor(Math.log2(currentStep + 1)) : 0;

  return (
    <div className="bg-slate-800/80 backdrop-blur rounded-2xl p-6 shadow-xl">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <GitBranch size={20} className="text-purple-400" />
        递归调用栈
      </h3>

      <div className="mb-4 flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2 text-slate-400">
          <Layers size={14} />
          <span>当前深度: <span className="text-white font-mono">{currentDepth}</span> / {maxDepth}</span>
        </div>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        {activeNodes.slice(0, Math.min(currentStep + 3, activeNodes.length)).map((node, index) => (
          <div
            key={node.id}
            className={`
              p-3 rounded-lg text-sm transition-all duration-300
              ${node.isCompleted
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : node.isActive
                  ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50 shadow-lg shadow-blue-500/20'
                  : 'bg-slate-700/50 text-slate-500'
              }
            `}
            style={{ marginLeft: `${node.depth * 16}px` }}
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs opacity-60">[{index}]</span>
              <span className="font-medium">
                hanoi({node.n}, {node.from} → {node.to}, {node.aux})
              </span>
            </div>
            {node.n === 1 && (
              <div className="text-xs mt-1 opacity-70 ml-6">
                移动盘子 1 从 {node.from} 到 {node.to}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="text-xs text-slate-500 space-y-1">
          <p>递归公式: T(n) = 2 × T(n-1) + 1</p>
          <p>时间复杂度: O(2<sup>n</sup>)</p>
          <p>空间复杂度: O(n)</p>
        </div>
      </div>
    </div>
  );
};
