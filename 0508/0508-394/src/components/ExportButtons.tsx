import React from 'react';
import { useDougongStore } from '@/store/useDougongStore';
import { exportDXF, exportExcel } from '@/lib/exporters';
import { FileDown, FileSpreadsheet } from 'lucide-react';

const ExportButtons: React.FC = () => {
  const dynasty = useDougongStore((s) => s.dynasty);
  const grade = useDougongStore((s) => s.grade);
  const jumps = useDougongStore((s) => s.jumps);
  const moduleData = useDougongStore((s) => s.moduleData);
  const components = useDougongStore((s) => s.components);

  const handleDXF = () => {
    if (!moduleData) return;
    exportDXF(dynasty, jumps, moduleData);
  };

  const handleExcel = () => {
    if (!moduleData) return;
    exportExcel(dynasty, grade, jumps, components);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={handleDXF}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#3E2723] border border-[#5D4037] text-[#F5F0E8] text-xs hover:border-[#C62828] hover:bg-[#4E342E] transition-all"
      >
        <FileDown className="w-3.5 h-3.5" />
        导出DXF
      </button>
      <button
        onClick={handleExcel}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#3E2723] border border-[#5D4037] text-[#F5F0E8] text-xs hover:border-[#C62828] hover:bg-[#4E342E] transition-all"
      >
        <FileSpreadsheet className="w-3.5 h-3.5" />
        导出Excel
      </button>
    </div>
  );
};

export default ExportButtons;
