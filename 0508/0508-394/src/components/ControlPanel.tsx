import { useDougongStore } from '@/store/useDougongStore';
import type { Dynasty } from '@/lib/types';
import { Building2, Sliders, Library } from 'lucide-react';
import { Link } from 'react-router-dom';

const GRADE_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
const GRADE_LABELS: Record<number, string> = {
  1: '一等材',
  2: '二等材',
  3: '三等材',
  4: '四等材',
  5: '五等材',
  6: '六等材',
  7: '七等材',
  8: '八等材',
};

export default function ControlPanel() {
  const { dynasty, grade, jumps, moduleData, setDynasty, setGrade, setJumps } = useDougongStore();

  return (
    <div className="flex h-full flex-col gap-5 rounded-xl border border-[#5D4037] bg-[#2C1B0E]/95 p-4 text-[#F5F0E8] shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-3 border-b border-[#5D4037] pb-4">
        <Building2 className="h-6 w-6 text-[#D4A843]" />
        <h1 className="font-serif text-xl font-bold tracking-wide">斗拱设计</h1>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium tracking-wider text-[#D4A843]">朝代</span>
        <div className="flex gap-2">
          {(['宋', '清'] as Dynasty[]).map((d) => (
            <button
              key={d}
              onClick={() => setDynasty(d)}
              className={`flex-1 rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                dynasty === d
                  ? 'border-[#C62828] bg-[#C62828] text-white shadow-md'
                  : 'border-[#5D4037] bg-[#3E2723] text-[#F5F0E8] hover:bg-[#4E342E]'
              }`}
            >
              {d}式
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium tracking-wider text-[#D4A843]">材等</span>
        <select
          value={grade}
          onChange={(e) => setGrade(Number(e.target.value))}
          className="rounded-lg border border-[#5D4037] bg-[#3E2723] px-3 py-2 text-sm text-[#F5F0E8] outline-none focus:border-[#D4A843]"
        >
          {GRADE_OPTIONS.map((g) => (
            <option key={g} value={g}>
              {GRADE_LABELS[g]}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium tracking-wider text-[#D4A843]">跳数</span>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={1}
            max={6}
            step={1}
            value={jumps}
            onChange={(e) => setJumps(Number(e.target.value))}
            className="h-2 flex-1 cursor-pointer appearance-none rounded-full bg-[#5D4037] accent-[#C62828]"
          />
          <span className="min-w-[2rem] rounded-md bg-[#3E2723] px-2 py-1 text-center text-sm font-bold">
            {jumps}
          </span>
        </div>
      </div>

      {moduleData && (
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium tracking-wider text-[#D4A843]">
            <Sliders className="mr-1 inline h-3 w-3" />
            模数数据
          </span>
          <div className="rounded-lg border border-[#5D4037] bg-[#3E2723]/60 p-3">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <div className="flex flex-col">
                <span className="text-xs text-[#D4A843]/70">单材广</span>
                <span>{moduleData.dancaiHeight} 份</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#D4A843]/70">单材厚</span>
                <span>{moduleData.dancaiWidth} 份</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#D4A843]/70">足材广</span>
                <span>{moduleData.zucaiHeight} 份</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-[#D4A843]/70">栔高</span>
                <span>{moduleData.qiHeight} 份</span>
              </div>
            </div>
            <div className="mt-2 border-t border-[#5D4037] pt-2 text-center text-sm font-medium">
              1 份 = {moduleData.fenMm} mm
            </div>
          </div>
        </div>
      )}

      <div className="mt-auto">
        <Link
          to="/presets"
          className="flex items-center justify-center gap-2 rounded-lg border border-[#5D4037] bg-[#3E2723] px-4 py-2.5 text-sm font-medium text-[#F5F0E8] transition-all hover:bg-[#4E342E]"
        >
          <Library className="h-4 w-4 text-[#D4A843]" />
          实例库
        </Link>
      </div>
    </div>
  );
}
