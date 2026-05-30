import { useState } from 'react';
import { RegionColors } from '../types';
import { useColorGraphAnalysis } from '../hooks/useColorGraphAnalysis';
import { ScrollText, GitMerge, Zap, BarChart3, Eye, EyeOff } from 'lucide-react';

interface PersonalityAnalysisProps {
  regionColors: RegionColors;
}

const PersonalityAnalysis = ({ regionColors }: PersonalityAnalysisProps) => {
  const [showGraph, setShowGraph] = useState(false);
  const analysis = useColorGraphAnalysis(regionColors);

  const getHarmonyLabel = (score: number) => {
    if (score >= 80) return { text: '高度和谐', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 60) return { text: '较为和谐', color: 'text-emerald-600', bg: 'bg-emerald-100' };
    if (score >= 40) return { text: '平衡折中', color: 'text-amber-600', bg: 'bg-amber-100' };
    if (score >= 20) return { text: '存在张力', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { text: '冲突强烈', color: 'text-red-600', bg: 'bg-red-100' };
  };

  const harmony = getHarmonyLabel(analysis.harmonyScore);

  return (
    <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl p-6 shadow-lg border border-amber-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ScrollText className="w-6 h-6 text-amber-800" />
          <h3 className="text-xl font-bold text-amber-900">性格图谱分析</h3>
        </div>
        <button
          onClick={() => setShowGraph(!showGraph)}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-amber-200 hover:bg-amber-300 rounded-lg text-amber-800 transition-colors"
        >
          {showGraph ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {showGraph ? '隐藏图谱' : '显示图谱'}
        </button>
      </div>

      <div className="bg-white/60 rounded-xl p-4 mb-4 border border-amber-200">
        <p className="text-amber-800 leading-relaxed">{analysis.overallDescription}</p>
      </div>

      {analysis.mainTraits.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-amber-700" />
            <h4 className="font-semibold text-amber-800">核心性格特质</h4>
          </div>
          <div className="space-y-3">
            {analysis.mainTraits.slice(0, 5).map((trait, index) => (
              <div key={trait.trait} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-amber-900">{trait.trait}</span>
                      <div className="flex gap-1">
                        {trait.sourceColors.slice(0, 3).map((color, i) => (
                          <div
                            key={i}
                            className="w-3 h-3 rounded-full border border-amber-300"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm text-amber-600 font-medium">{trait.score}%</span>
                  </div>
                  <div className="w-full bg-amber-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-700"
                      style={{
                        width: `${trait.score}%`,
                        background: `linear-gradient(to right, ${trait.sourceColors[0] || '#8B4513'}, ${trait.sourceColors[1] || trait.sourceColors[0] || '#D97706'})`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold text-amber-800">配色和谐度</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${harmony.bg} ${harmony.color}`}>
            {harmony.text}
          </span>
        </div>
        <div className="w-full bg-gradient-to-r from-red-200 via-amber-200 to-green-200 rounded-full h-3">
          <div
            className="relative h-3 transition-all duration-700"
            style={{ width: `${analysis.harmonyScore}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-amber-400 rounded-full shadow-md" />
          </div>
        </div>
        <div className="flex justify-between mt-1 text-xs text-amber-500">
          <span>冲突</span>
          <span>和谐</span>
        </div>
      </div>

      {analysis.enhanceRelationships.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <GitMerge className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-green-700">色彩增益关系</span>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {analysis.enhanceRelationships.map((rel, i) => (
              <div
                key={`enhance-${i}`}
                className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200"
              >
                <div className="flex items-center gap-1">
                  <div
                    className="w-5 h-5 rounded-full border border-green-300"
                    style={{ backgroundColor: rel.fromNode.color }}
                  />
                  <span className="text-xs text-green-800 font-medium">{rel.fromNode.name}</span>
                </div>
                <span className="text-green-500 text-xs">↔</span>
                <div className="flex items-center gap-1">
                  <div
                    className="w-5 h-5 rounded-full border border-green-300"
                    style={{ backgroundColor: rel.toNode.color }}
                  />
                  <span className="text-xs text-green-800 font-medium">{rel.toNode.name}</span>
                </div>
                <span className="text-xs text-green-600 ml-auto">
                  增益 {Math.round(rel.edge.weight * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.conflictRelationships.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-red-600" />
            <span className="text-sm font-semibold text-red-700">色彩冲突关系</span>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {analysis.conflictRelationships.map((rel, i) => (
              <div
                key={`conflict-${i}`}
                className="flex items-center gap-2 p-2 bg-red-50 rounded-lg border border-red-200"
              >
                <div className="flex items-center gap-1">
                  <div
                    className="w-5 h-5 rounded-full border border-red-300"
                    style={{ backgroundColor: rel.fromNode.color }}
                  />
                  <span className="text-xs text-red-800 font-medium">{rel.fromNode.name}</span>
                </div>
                <span className="text-red-500 text-xs">⇔</span>
                <div className="flex items-center gap-1">
                  <div
                    className="w-5 h-5 rounded-full border border-red-300"
                    style={{ backgroundColor: rel.toNode.color }}
                  />
                  <span className="text-xs text-red-800 font-medium">{rel.toNode.name}</span>
                </div>
                <span className="text-xs text-red-600 ml-auto">
                  冲突 {Math.round(rel.edge.weight * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showGraph && (
        <div className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200">
          <h5 className="font-semibold text-amber-800 mb-3 text-center">色彩知识图谱</h5>
          <div className="relative h-48 bg-white rounded-lg overflow-hidden border border-amber-200">
            <svg viewBox="0 0 300 180" className="w-full h-full">
              {analysis.colorNodes.length <= 6 &&
                analysis.colorNodes.map((node, i) => {
                  const angle = (i / analysis.colorNodes.length) * Math.PI * 2 - Math.PI / 2;
                  const radius = 60;
                  const cx = 150 + Math.cos(angle) * radius;
                  const cy = 90 + Math.sin(angle) * radius;
                  return (
                    <g key={`node-${node.color}`}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r={15}
                        fill={node.color}
                        stroke="#d97706"
                        strokeWidth="2"
                      />
                      <text
                        x={cx}
                        y={cy + 4}
                        textAnchor="middle"
                        fontSize="8"
                        fill={['#FFFFFF', '#F0F0F0', '#FFD700', '#4CAF50', '#42A5F5', '#FFB74D', '#F5DEB3', '#FFB6C1', '#40E0D0'].includes(node.color) ? '#333' : '#fff'}
                        fontWeight="bold"
                      >
                        {node.name.slice(0, 2)}
                      </text>
                    </g>
                  );
                })}

              {analysis.enhanceRelationships.slice(0, 4).map((rel, i) => {
                const fromIdx = analysis.colorNodes.findIndex(n => n.color === rel.fromNode.color);
                const toIdx = analysis.colorNodes.findIndex(n => n.color === rel.toNode.color);
                if (fromIdx === -1 || toIdx === -1) return null;
                const fromAngle = (fromIdx / analysis.colorNodes.length) * Math.PI * 2 - Math.PI / 2;
                const toAngle = (toIdx / analysis.colorNodes.length) * Math.PI * 2 - Math.PI / 2;
                const radius = 60;
                return (
                  <line
                    key={`line-enhance-${i}`}
                    x1={150 + Math.cos(fromAngle) * radius}
                    y1={90 + Math.sin(fromAngle) * radius}
                    x2={150 + Math.cos(toAngle) * radius}
                    y2={90 + Math.sin(toAngle) * radius}
                    stroke="#22c55e"
                    strokeWidth="2"
                    strokeDasharray="4,4"
                  />
                );
              })}

              {analysis.conflictRelationships.slice(0, 4).map((rel, i) => {
                const fromIdx = analysis.colorNodes.findIndex(n => n.color === rel.fromNode.color);
                const toIdx = analysis.colorNodes.findIndex(n => n.color === rel.toNode.color);
                if (fromIdx === -1 || toIdx === -1) return null;
                const fromAngle = (fromIdx / analysis.colorNodes.length) * Math.PI * 2 - Math.PI / 2;
                const toAngle = (toIdx / analysis.colorNodes.length) * Math.PI * 2 - Math.PI / 2;
                const radius = 60;
                return (
                  <line
                    key={`line-conflict-${i}`}
                    x1={150 + Math.cos(fromAngle) * radius}
                    y1={90 + Math.sin(fromAngle) * radius}
                    x2={150 + Math.cos(toAngle) * radius}
                    y2={90 + Math.sin(toAngle) * radius}
                    stroke="#ef4444"
                    strokeWidth="2"
                  />
                );
              })}
            </svg>
            <div className="absolute bottom-2 left-2 flex gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-6 h-0.5 bg-green-500" style={{ borderStyle: 'dashed' }}></div>
                <span className="text-green-600">增益</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-6 h-0.5 bg-red-500"></div>
                <span className="text-red-600">冲突</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-amber-300">
        <p className="text-xs text-amber-600 text-center">
          🎭 色彩知识图谱：红忠·黑直·白奸·金神·绿莽·蓝智
        </p>
      </div>
    </div>
  );
};

export default PersonalityAnalysis;
