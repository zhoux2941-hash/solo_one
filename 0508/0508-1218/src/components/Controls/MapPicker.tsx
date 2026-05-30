import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/appStore';
import type { UserLocation } from '@/types';
import { GlowButton } from '@/components/UI/GlowButton';
import { MapPin, Target, Check } from 'lucide-react';

interface City {
  name: string;
  lat: number;
  lon: number;
}

const PRESET_CITIES: City[] = [
  { name: '北京', lat: 39.9042, lon: 116.4074 },
  { name: '上海', lat: 31.2304, lon: 121.4737 },
  { name: '广州', lat: 23.1291, lon: 113.2644 },
  { name: '深圳', lat: 22.5431, lon: 114.0579 },
  { name: '成都', lat: 30.5728, lon: 104.0668 },
  { name: '西安', lat: 34.3416, lon: 108.9398 },
  { name: '东京', lat: 35.6762, lon: 139.6503 },
  { name: '纽约', lat: 40.7128, lon: -74.0060 },
  { name: '伦敦', lat: 51.5074, lon: -0.1278 },
  { name: '巴黎', lat: 48.8566, lon: 2.3522 },
  { name: '莫斯科', lat: 55.7558, lon: 37.6173 },
  { name: '悉尼', lat: -33.8688, lon: 151.2093 },
];

export function MapPicker() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const userLocation = useAppStore((s) => s.userLocation);
  const setUserLocation = useAppStore((s) => s.setUserLocation);
  const setShowLocationModal = useAppStore((s) => s.setShowLocationModal);

  const [selected, setSelected] = useState<UserLocation>({ ...userLocation });
  const [latInput, setLatInput] = useState(userLocation.lat.toString());
  const [lonInput, setLonInput] = useState(userLocation.lon.toString());
  const [nameInput, setNameInput] = useState(userLocation.name || '');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = '#0f1520';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(0, 212, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 12; i++) {
      const x = (i / 12) * w;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let i = 0; i <= 8; i++) {
      const y = (i / 8) * h;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(0, 212, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, w, h);

    const equator = h / 2;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, equator);
    ctx.lineTo(w, equator);
    ctx.stroke();

    const prime = w / 2;
    ctx.beginPath();
    ctx.moveTo(prime, 0);
    ctx.lineTo(prime, h);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = 'rgba(0, 255, 136, 0.15)';
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.4)';
    ctx.lineWidth = 1;

    drawContinent(ctx, w, h, northAmerica(), 0.2);
    drawContinent(ctx, w, h, southAmerica(), 0.2);
    drawContinent(ctx, w, h, europe(), 0.25);
    drawContinent(ctx, w, h, asia(), 0.25);
    drawContinent(ctx, w, h, africa(), 0.2);
    drawContinent(ctx, w, h, australia(), 0.15);

    PRESET_CITIES.forEach((city) => {
      const x = ((city.lon + 180) / 360) * w;
      const y = ((90 - city.lat) / 180) * h;
      ctx.fillStyle = 'rgba(0, 212, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    const selX = ((selected.lon + 180) / 360) * w;
    const selY = ((90 - selected.lat) / 180) * h;

    const gradient = ctx.createRadialGradient(selX, selY, 0, selX, selY, 20);
    gradient.addColorStop(0, 'rgba(0, 255, 136, 0.6)');
    gradient.addColorStop(1, 'rgba(0, 255, 136, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(selX, selY, 20, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.arc(selX, selY, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(selX, selY, 8, 0, Math.PI * 2);
    ctx.stroke();
  }, [selected]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const lon = (x / canvas.width) * 360 - 180;
    const lat = 90 - (y / canvas.height) * 180;

    const clampedLat = Math.max(-90, Math.min(90, lat));
    const clampedLon = Math.max(-180, Math.min(180, lon));

    setSelected({ lat: clampedLat, lon: clampedLon, alt: 0.05, name: '' });
    setLatInput(clampedLat.toFixed(4));
    setLonInput(clampedLon.toFixed(4));
    setNameInput('');
  };

  const handleInputApply = () => {
    const lat = parseFloat(latInput);
    const lon = parseFloat(lonInput);
    if (!isNaN(lat) && !isNaN(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
      setSelected({ lat, lon, alt: 0.05, name: nameInput || undefined });
    }
  };

  const selectCity = (city: City) => {
    setSelected({ lat: city.lat, lon: city.lon, alt: 0.05, name: city.name });
    setLatInput(city.lat.toString());
    setLonInput(city.lon.toString());
    setNameInput(city.name);
  };

  const handleConfirm = () => {
    setUserLocation(selected);
    setShowLocationModal(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <div className="flex-1">
          <canvas
            ref={canvasRef}
            width={400}
            height={250}
            onClick={handleCanvasClick}
            className="rounded-xl border border-emerald-400/30 cursor-crosshair w-full"
          />
          <p className="text-xs text-white/50 mt-2 text-center">点击地图选择观测位置</p>
        </div>

        <div className="w-56 space-y-4">
          <div>
            <label className="text-xs text-white/50 block mb-1.5">常用城市</label>
            <div className="grid grid-cols-3 gap-1.5">
              {PRESET_CITIES.map((city) => (
                <button
                  key={city.name}
                  onClick={() => selectCity(city)}
                  className="px-2 py-1 text-xs rounded-lg bg-white/5 hover:bg-emerald-500/20 text-white/70 hover:text-emerald-300 border border-white/10 hover:border-emerald-400/30 transition-all"
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-white/50 block">手动输入</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="text-[10px] text-white/40 mb-1">纬度</div>
                  <input
                    type="number"
                    value={latInput}
                    onChange={(e) => setLatInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-emerald-400/50 focus:outline-none"
                    step="0.0001"
                    min="-90"
                    max="90"
                  />
                </div>
                <div className="flex-1">
                  <div className="text-[10px] text-white/40 mb-1">经度</div>
                  <input
                    type="number"
                    value={lonInput}
                    onChange={(e) => setLonInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-emerald-400/50 focus:outline-none"
                    step="0.0001"
                    min="-180"
                    max="180"
                  />
                </div>
              </div>
              <div>
                <div className="text-[10px] text-white/40 mb-1">地点名称（可选）</div>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="例如：我的位置"
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/20 focus:border-emerald-400/50 focus:outline-none"
                />
              </div>
              <button
                onClick={handleInputApply}
                className="w-full py-2 text-xs rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white border border-white/10 flex items-center justify-center gap-1.5 transition-all"
              >
                <Target size={12} />
                应用到地图
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
        <div className="flex items-center gap-3">
          <MapPin size={16} className="text-emerald-400" />
          <div>
            <div className="text-sm text-white font-medium">
              {selected.name || '已选择位置'}
            </div>
            <div className="text-xs text-white/50 font-mono">
              {selected.lat.toFixed(4)}, {selected.lon.toFixed(4)}
            </div>
          </div>
        </div>
        <GlowButton variant="primary" glow="green" onClick={handleConfirm}>
          <Check size={16} className="inline mr-1.5" />
          确认选择
        </GlowButton>
      </div>
    </div>
  );
}

function drawContinent(ctx: CanvasRenderingContext2D, w: number, h: number, points: [number, number][], alpha: number) {
  ctx.beginPath();
  points.forEach(([lat, lon], i) => {
    const x = ((lon + 180) / 360) * w;
    const y = ((90 - lat) / 180) * h;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = `rgba(0, 255, 136, ${alpha})`;
  ctx.fill();
  ctx.strokeStyle = `rgba(0, 255, 136, ${alpha * 2})`;
  ctx.lineWidth = 1;
  ctx.stroke();
}

function northAmerica(): [number, number][] {
  return [
    [71, -156], [71, -78], [50, -55], [48, -63], [45, -60], [42, -70], [30, -81],
    [25, -80], [20, -97], [15, -105], [18, -108], [32, -117], [38, -123], [49, -124],
    [55, -130], [60, -138], [65, -145], [71, -156],
  ];
}

function southAmerica(): [number, number][] {
  return [
    [12, -71], [12, -61], [0, -50], [-5, -35], [-15, -38], [-35, -56],
    [-54, -68], [-54, -74], [-40, -75], [-20, -70], [-5, -80], [5, -78], [12, -71],
  ];
}

function europe(): [number, number][] {
  return [
    [71, 18], [71, 31], [60, 30], [55, 40], [45, 35], [40, 28], [38, 18],
    [35, -5], [43, -1], [50, -5], [60, 5], [71, 18],
  ];
}

function asia(): [number, number][] {
  return [
    [70, 32], [75, 100], [75, 140], [55, 142], [45, 132], [40, 125], [35, 125],
    [30, 121], [25, 120], [20, 110], [10, 105], [8, 95], [15, 75], [25, 65],
    [25, 55], [30, 45], [38, 40], [40, 28], [50, 30], [60, 30], [70, 32],
  ];
}

function africa(): [number, number][] {
  return [
    [35, -6], [35, 12], [30, 30], [20, 35], [10, 42], [10, 50], [-5, 40],
    [-30, 18], [-35, 18], [-35, 15], [-20, 10], [-5, 8], [-15, -8], [0, -15],
    [10, -17], [20, -17], [25, -15], [35, -6],
  ];
}

function australia(): [number, number][] {
  return [
    [-10, 142], [-10, 152], [-25, 153], [-35, 150], [-38, 144], [-35, 137],
    [-25, 113], [-20, 116], [-15, 124], [-12, 130], [-10, 142],
  ];
}
