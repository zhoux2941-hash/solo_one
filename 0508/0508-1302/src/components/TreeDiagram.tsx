import React from 'react';
import { BayesianResult, DisplayFormat } from '../types';
import { formatProbability, formatNumber } from '../utils/formatters';

interface TreeDiagramProps {
  result: BayesianResult;
  displayFormat: DisplayFormat;
}

export const TreeDiagram: React.FC<TreeDiagramProps> = ({ result, displayFormat }) => {
  const { totalPopulation, truePositives, falsePositives, trueNegatives, falseNegatives } = result;
  
  const sickCount = truePositives + falseNegatives;
  const healthyCount = trueNegatives + falsePositives;
  const positiveCount = truePositives + falsePositives;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
        <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
        概率树形图
      </h2>

      <div className="overflow-x-auto">
        <svg viewBox="0 0 700 400" className="w-full min-w-[500px]">
          <defs>
            <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
              <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
            </marker>
          </defs>

          <g>
            <circle cx="50" cy="200" r="35" fill="#1e3a5f" />
            <text x="50" y="195" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">总人群</text>
            <text x="50" y="215" textAnchor="middle" fill="white" fontSize="11">
              {displayFormat === 'frequency' ? formatNumber(totalPopulation) : '100%'}
            </text>
          </g>

          <line x1="85" y1="170" x2="180" y2="100" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" />
          <line x1="85" y1="230" x2="180" y2="300" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" />

          <text x="130" y="120" textAnchor="middle" fill="#dc2626" fontSize="11" fontWeight="500">
            患病 {displayFormat === 'frequency' ? formatNumber(sickCount) : formatProbability(sickCount / totalPopulation)}
          </text>
          <text x="130" y="320" textAnchor="middle" fill="#16a34a" fontSize="11" fontWeight="500">
            未患病 {displayFormat === 'frequency' ? formatNumber(healthyCount) : formatProbability(healthyCount / totalPopulation)}
          </text>

          <g>
            <rect x="190" y="70" width="100" height="60" rx="8" fill="#fef2f2" stroke="#dc2626" strokeWidth="2" />
            <text x="240" y="98" textAnchor="middle" fill="#dc2626" fontSize="12" fontWeight="bold">患病</text>
            <text x="240" y="118" textAnchor="middle" fill="#991b1b" fontSize="11">
              {displayFormat === 'frequency' ? formatNumber(sickCount) + '人' : formatProbability(sickCount / totalPopulation)}
            </text>
          </g>

          <g>
            <rect x="190" y="270" width="100" height="60" rx="8" fill="#f0fdf4" stroke="#16a34a" strokeWidth="2" />
            <text x="240" y="298" textAnchor="middle" fill="#16a34a" fontSize="12" fontWeight="bold">未患病</text>
            <text x="240" y="318" textAnchor="middle" fill="#166534" fontSize="11">
              {displayFormat === 'frequency' ? formatNumber(healthyCount) + '人' : formatProbability(healthyCount / totalPopulation)}
            </text>
          </g>

          <line x1="290" y1="85" x2="380" y2="60" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" />
          <line x1="290" y1="115" x2="380" y2="140" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" />
          <line x1="290" y1="285" x2="380" y2="260" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" />
          <line x1="290" y1="315" x2="380" y2="340" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" />

          <text x="335" y="65" textAnchor="middle" fill="#dc2626" fontSize="10">阳性</text>
          <text x="335" y="135" textAnchor="middle" fill="#d97706" fontSize="10">阴性</text>
          <text x="335" y="250" textAnchor="middle" fill="#ea580c" fontSize="10">阳性</text>
          <text x="335" y="360" textAnchor="middle" fill="#16a34a" fontSize="10">阴性</text>

          <g>
            <rect x="390" y="35" width="110" height="50" rx="8" fill="#fee2e2" stroke="#dc2626" strokeWidth="2" />
            <text x="445" y="58" textAnchor="middle" fill="#dc2626" fontSize="11" fontWeight="bold">真阳性</text>
            <text x="445" y="76" textAnchor="middle" fill="#991b1b" fontSize="10">
              {displayFormat === 'frequency' ? formatNumber(truePositives) : formatProbability(truePositives / totalPopulation)}
            </text>
          </g>

          <g>
            <rect x="390" y="115" width="110" height="50" rx="8" fill="#fef3c7" stroke="#d97706" strokeWidth="2" />
            <text x="445" y="138" textAnchor="middle" fill="#d97706" fontSize="11" fontWeight="bold">假阴性</text>
            <text x="445" y="156" textAnchor="middle" fill="#92400e" fontSize="10">
              {displayFormat === 'frequency' ? formatNumber(falseNegatives) : formatProbability(falseNegatives / totalPopulation)}
            </text>
          </g>

          <g>
            <rect x="390" y="235" width="110" height="50" rx="8" fill="#ffedd5" stroke="#ea580c" strokeWidth="2" />
            <text x="445" y="258" textAnchor="middle" fill="#ea580c" fontSize="11" fontWeight="bold">假阳性</text>
            <text x="445" y="276" textAnchor="middle" fill="#9a3412" fontSize="10">
              {displayFormat === 'frequency' ? formatNumber(falsePositives) : formatProbability(falsePositives / totalPopulation)}
            </text>
          </g>

          <g>
            <rect x="390" y="315" width="110" height="50" rx="8" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" />
            <text x="445" y="338" textAnchor="middle" fill="#16a34a" fontSize="11" fontWeight="bold">真阴性</text>
            <text x="445" y="356" textAnchor="middle" fill="#166534" fontSize="10">
              {displayFormat === 'frequency' ? formatNumber(trueNegatives) : formatProbability(trueNegatives / totalPopulation)}
            </text>
          </g>

          <line x1="500" y1="60" x2="570" y2="160" stroke="#0ea5e9" strokeWidth="3" markerEnd="url(#arrowhead)" />
          <line x1="500" y1="260" x2="570" y2="180" stroke="#0ea5e9" strokeWidth="3" markerEnd="url(#arrowhead)" />

          <g>
            <rect x="570" y="145" width="120" height="70" rx="8" fill="#e0f2fe" stroke="#0284c7" strokeWidth="3" />
            <text x="630" y="172" textAnchor="middle" fill="#0369a1" fontSize="12" fontWeight="bold">检测阳性</text>
            <text x="630" y="192" textAnchor="middle" fill="#075985" fontSize="11">
              {displayFormat === 'frequency' ? formatNumber(positiveCount) + '人' : formatProbability(positiveCount / totalPopulation)}
            </text>
            <text x="630" y="208" textAnchor="middle" fill="#0369a1" fontSize="10">
              真阳性率: {formatProbability(result.posteriorProbability)}
            </text>
          </g>
        </svg>
      </div>

      <div className="flex flex-wrap gap-4 mt-4 justify-center">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-red-500"></span>
          <span className="text-sm text-slate-600">真阳性</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-amber-500"></span>
          <span className="text-sm text-slate-600">假阴性</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-orange-500"></span>
          <span className="text-sm text-slate-600">假阳性</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded bg-green-500"></span>
          <span className="text-sm text-slate-600">真阴性</span>
        </div>
      </div>
    </div>
  );
};
