import { Download, RotateCcw } from 'lucide-react';

interface ExportButtonProps {
  onExport: () => void;
  onReset: () => void;
}

const ExportButton = ({ onExport, onReset }: ExportButtonProps) => {
  return (
    <div className="flex gap-3 justify-center">
      <button
        onClick={onReset}
        className="flex items-center gap-2 px-6 py-3 bg-white text-amber-800 border-2 border-amber-300 rounded-xl font-medium hover:bg-amber-50 hover:border-amber-400 transition-all duration-300 shadow-md hover:shadow-lg"
      >
        <RotateCcw className="w-5 h-5" />
        重置填色
      </button>
      <button
        onClick={onExport}
        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-xl font-medium hover:from-amber-700 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
      >
        <Download className="w-5 h-5" />
        导出PNG
      </button>
    </div>
  );
};

export default ExportButton;
