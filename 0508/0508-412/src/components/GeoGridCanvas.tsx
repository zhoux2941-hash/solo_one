import { useRef, useEffect } from "react";
import type { BBox } from "@/utils/geohash";

interface GeoGridCanvasProps {
  centerBBox: BBox;
  neighbors: Record<string, string>;
  currentHash: string;
}

const DIRECTION_LABELS: Record<string, string> = {
  nw: "西北",
  n: "北",
  ne: "东北",
  w: "西",
  e: "东",
  sw: "西南",
  s: "南",
  se: "东南",
};

const DIRECTION_POSITIONS: Record<string, [number, number]> = {
  nw: [0, 0],
  n: [1, 0],
  ne: [2, 0],
  w: [0, 1],
  e: [2, 1],
  sw: [0, 2],
  s: [1, 2],
  se: [2, 2],
};

export default function GeoGridCanvas({ centerBBox, neighbors, currentHash }: GeoGridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    ctx.fillStyle = "#0F172A";
    ctx.fillRect(0, 0, w, h);

    const padding = 20;
    const cellW = (w - padding * 2) / 3;
    const cellH = (h - padding * 2) / 3;

    const gridColors = [
      ["#1E293B", "#1E293B", "#1E293B"],
      ["#1E293B", "#0D9488", "#1E293B"],
      ["#1E293B", "#1E293B", "#1E293B"],
    ];

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const x = padding + col * cellW;
        const y = padding + row * cellH;

        const isCenter = row === 1 && col === 1;
        ctx.fillStyle = isCenter ? "#0D948833" : gridColors[row][col] + "CC";
        ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

        if (isCenter) {
          const gradient = ctx.createLinearGradient(x, y, x + cellW, y + cellH);
          gradient.addColorStop(0, "#0D948844");
          gradient.addColorStop(1, "#0D948822");
          ctx.fillStyle = gradient;
          ctx.fillRect(x + 1, y + 1, cellW - 2, cellH - 2);

          ctx.strokeStyle = "#0D9488";
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 2, y + 2, cellW - 4, cellH - 4);
        }
      }
    }

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        const x = padding + col * cellW;
        const y = padding + row * cellH;
        const isCenter = row === 1 && col === 1;

        if (isCenter) {
          ctx.font = `bold ${Math.min(cellW, cellH) * 0.16}px "JetBrains Mono", monospace`;
          ctx.fillStyle = "#F59E0B";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(currentHash, x + cellW / 2, y + cellH / 2 - cellH * 0.08);

          ctx.font = `${Math.min(cellW, cellH) * 0.08}px "JetBrains Mono", monospace`;
          ctx.fillStyle = "#E2E8F0";
          ctx.fillText("当前区域", x + cellW / 2, y + cellH / 2 + cellH * 0.12);
        } else {
          const dirKey = Object.entries(DIRECTION_POSITIONS).find(
            ([, [c, r]]) => c === col && r === row
          )?.[0];

          if (dirKey && neighbors[dirKey]) {
            ctx.font = `bold ${Math.min(cellW, cellH) * 0.12}px "JetBrains Mono", monospace`;
            ctx.fillStyle = "#94A3B8";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(neighbors[dirKey], x + cellW / 2, y + cellH / 2 - cellH * 0.08);

            ctx.font = `${Math.min(cellW, cellH) * 0.08}px "Noto Sans SC", sans-serif`;
            ctx.fillStyle = "#64748B";
            ctx.fillText(DIRECTION_LABELS[dirKey], x + cellW / 2, y + cellH / 2 + cellH * 0.12);
          }
        }
      }
    }

    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(padding + i * cellW, padding);
      ctx.lineTo(padding + i * cellW, padding + 3 * cellH);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(padding, padding + i * cellH);
      ctx.lineTo(padding + 3 * cellW, padding + i * cellH);
      ctx.stroke();
    }

    const latSpan = centerBBox.maxLat - centerBBox.minLat;
    const lngSpan = centerBBox.maxLng - centerBBox.minLng;
    ctx.font = `${Math.min(cellW, cellH) * 0.065}px "JetBrains Mono", monospace`;
    ctx.fillStyle = "#475569";
    ctx.textAlign = "center";
    ctx.fillText(
      `纬度范围: ${centerBBox.minLat.toFixed(4)}° ~ ${centerBBox.maxLat.toFixed(4)}° (${latSpan.toFixed(4)}°)`,
      w / 2,
      h - 4
    );
    ctx.textAlign = "left";
    ctx.fillText(
      `经度范围: ${centerBBox.minLng.toFixed(4)}° ~ ${centerBBox.maxLng.toFixed(4)}° (${lngSpan.toFixed(4)}°)`,
      padding,
      12
    );
  }, [centerBBox, neighbors, currentHash]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-xl border border-slate-700/50"
      style={{ height: "420px" }}
    />
  );
}
