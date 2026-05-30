import { useRef, useEffect, useCallback } from 'react';
import { FaceTemplate, RegionColors } from '../types';
import { Paintbrush } from 'lucide-react';

interface MaskCanvasProps {
  template: FaceTemplate | undefined;
  regionColors: RegionColors;
  selectedColor: string;
  onRegionClick: (regionId: string) => void;
}

const MaskCanvas = ({ template, regionColors, selectedColor, onRegionClick }: MaskCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawMask = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !template) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#FEF7E6';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    template.regions.forEach((region) => {
      const path = new Path2D(region.path);
      const color = regionColors[region.id] || '#FFFFFF';
      ctx.fillStyle = color;
      ctx.fill(path);
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 2;
      ctx.stroke(path);
    });

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = template.svg;
    const svg = tempDiv.querySelector('svg');
    if (svg) {
      const paths = svg.querySelectorAll('path, ellipse, circle');
      paths.forEach((elem) => {
        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1.5;
        if (elem.tagName === 'path') {
          const d = elem.getAttribute('d');
          if (d) {
            const path = new Path2D(d);
            ctx.stroke(path);
          }
        } else if (elem.tagName === 'ellipse') {
          const cx = parseFloat(elem.getAttribute('cx') || '0');
          const cy = parseFloat(elem.getAttribute('cy') || '0');
          const rx = parseFloat(elem.getAttribute('rx') || '0');
          const ry = parseFloat(elem.getAttribute('ry') || '0');
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
          ctx.stroke();
        } else if (elem.tagName === 'circle') {
          const cx = parseFloat(elem.getAttribute('cx') || '0');
          const cy = parseFloat(elem.getAttribute('cy') || '0');
          const r = parseFloat(elem.getAttribute('r') || '0');
          ctx.fillStyle = '#1a1a1a';
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
  }, [template, regionColors]);

  useEffect(() => {
    drawMask();
  }, [drawMask]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !template) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    for (let i = template.regions.length - 1; i >= 0; i--) {
      const region = template.regions[i];
      const path = new Path2D(region.path);
      if (ctx.isPointInPath(path, x, y)) {
        onRegionClick(region.id);
        break;
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-amber-200">
      <div className="flex items-center gap-2 mb-4">
        <Paintbrush className="w-6 h-6 text-amber-700" />
        <h3 className="text-xl font-bold text-amber-900">面具填色区</h3>
        <span className="ml-auto text-sm text-amber-600">点击面具区域上色</span>
      </div>
      <div className="flex justify-center">
        <div className="relative bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 border-4 border-amber-300 shadow-inner">
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute top-2 left-2 w-8 h-8 border-t-2 border-l-2 border-amber-400 rounded-tl-lg"></div>
            <div className="absolute top-2 right-2 w-8 h-8 border-t-2 border-r-2 border-amber-400 rounded-tr-lg"></div>
            <div className="absolute bottom-2 left-2 w-8 h-8 border-b-2 border-l-2 border-amber-400 rounded-bl-lg"></div>
            <div className="absolute bottom-2 right-2 w-8 h-8 border-b-2 border-r-2 border-amber-400 rounded-br-lg"></div>
          </div>
          <canvas
            ref={canvasRef}
            width={300}
            height={400}
            onClick={handleCanvasClick}
            className="cursor-pointer rounded-lg shadow-md hover:shadow-lg transition-shadow"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </div>
      </div>
    </div>
  );
};

export default MaskCanvas;
