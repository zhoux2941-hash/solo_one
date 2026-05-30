import React from 'react';
import { useDougongStore } from '@/store/useDougongStore';
import { Package } from 'lucide-react';

const ComponentList: React.FC = () => {
  const components = useDougongStore((s) => s.components);

  const totalVolume = components.reduce((sum, c) => sum + c.volumeMm3, 0);
  const totalParts = components.reduce((sum, c) => sum + c.count, 0);

  const typeColors: Record<string, string> = {
    '斗': 'bg-[#8D6E63] text-white',
    '拱': 'bg-[#A1887F] text-white',
    '昂': 'bg-[#6D4C41] text-white',
    '枋': 'bg-[#5D4037] text-white',
  };

  return (
    <div className="bg-[#2C1B0E]/95 backdrop-blur rounded-lg border border-[#5D4037]/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Package className="w-4 h-4 text-[#D4A843]" />
        <h3 className="text-[#D4A843] font-serif text-sm tracking-wider">构件列表</h3>
        <div className="ml-auto flex gap-4 text-xs text-[#8D6E63]">
          <span>构件种类: {components.length}</span>
          <span>构件总数: {totalParts}</span>
          <span>净材总量: {(totalVolume / 1e6).toFixed(2)} dm³</span>
        </div>
      </div>

      <div className="overflow-auto max-h-64">
        <table className="w-full text-xs text-[#F5F0E8]">
          <thead>
            <tr className="border-b border-[#5D4037]/40 text-[#8D6E63]">
              <th className="text-left py-1.5 px-2">构件名称</th>
              <th className="text-center py-1.5 px-2">类型</th>
              <th className="text-right py-1.5 px-2">宽(份)</th>
              <th className="text-right py-1.5 px-2">高(份)</th>
              <th className="text-right py-1.5 px-2">深(份)</th>
              <th className="text-right py-1.5 px-2">宽(mm)</th>
              <th className="text-right py-1.5 px-2">高(mm)</th>
              <th className="text-right py-1.5 px-2">深(mm)</th>
              <th className="text-center py-1.5 px-2">数量</th>
              <th className="text-right py-1.5 px-2">净材(mm³)</th>
            </tr>
          </thead>
          <tbody>
            {components.map((c, i) => (
              <tr key={i} className="border-b border-[#5D4037]/20 hover:bg-[#3E2723]/30 transition-colors">
                <td className="py-1.5 px-2 font-serif">{c.name}</td>
                <td className="py-1.5 px-2 text-center">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] ${typeColors[c.type] || ''}`}>
                    {c.type}
                  </span>
                </td>
                <td className="py-1.5 px-2 text-right text-[#BCAAA4]">{c.widthFen}</td>
                <td className="py-1.5 px-2 text-right text-[#BCAAA4]">{c.heightFen}</td>
                <td className="py-1.5 px-2 text-right text-[#BCAAA4]">{c.depthFen}</td>
                <td className="py-1.5 px-2 text-right">{c.widthMm.toFixed(1)}</td>
                <td className="py-1.5 px-2 text-right">{c.heightMm.toFixed(1)}</td>
                <td className="py-1.5 px-2 text-right">{c.depthMm.toFixed(1)}</td>
                <td className="py-1.5 px-2 text-center font-medium text-[#D4A843]">{c.count}</td>
                <td className="py-1.5 px-2 text-right text-[#BCAAA4]">{(c.volumeMm3 / 1e3).toFixed(1)}k</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-[#D4A843]/40 font-serif text-[#D4A843]">
              <td className="py-2 px-2" colSpan={8}>合计</td>
              <td className="py-2 px-2 text-center">{totalParts}</td>
              <td className="py-2 px-2 text-right">{(totalVolume / 1e6).toFixed(2)}dm³</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default ComponentList;
