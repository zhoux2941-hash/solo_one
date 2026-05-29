import React, { useRef, useState } from 'react';
import { Image, Download, Palette } from 'lucide-react';
import html2canvas from 'html2canvas';

interface ExportPanelProps {
  poem: string[];
}

const backgrounds = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
];

export const ExportPanel: React.FC<ExportPanelProps> = ({ poem }) => {
  const poemRef = useRef<HTMLDivElement>(null);
  const [selectedBg, setSelectedBg] = useState(0);

  const handleExport = async () => {
    if (poemRef.current) {
      const canvas = await html2canvas(poemRef.current, {
        scale: 2,
        backgroundColor: null,
      });
      const link = document.createElement('a');
      link.download = '藏头诗.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 mt-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-lg">
          <Image className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="font-bold text-gray-800">导出图片</h3>
          <p className="text-sm text-gray-500">将诗句保存为图片</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Palette className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">选择背景</span>
        </div>
        <div className="flex gap-2">
          {backgrounds.map((bg, index) => (
            <button
              key={index}
              onClick={() => setSelectedBg(index)}
              className={`w-12 h-12 rounded-lg border-2 transition-all ${
                selectedBg === index ? 'border-purple-500 scale-110' : 'border-transparent'
              }`}
              style={{ background: bg }}
            />
          ))}
        </div>
      </div>

      <div
        ref={poemRef}
        className="p-8 rounded-xl text-center"
        style={{ background: backgrounds[selectedBg] }}
      >
        <div className="space-y-4">
          {poem.map((line, index) => (
            <p
              key={index}
              className="text-2xl font-medium text-white poem-text text-shadow"
            >
              {line}
            </p>
          ))}
        </div>
      </div>

      <button
        onClick={handleExport}
        className="w-full mt-4 py-3 bg-gradient-to-r from-cyan-500 to-teal-500 text-white font-bold rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all flex items-center justify-center gap-2"
      >
        <Download className="w-5 h-5" />
        下载图片
      </button>
    </div>
  );
};


