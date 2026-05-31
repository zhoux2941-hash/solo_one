import { useGeoHashStore } from "@/hooks/useGeoHashStore";
import { PRESET_LOCATIONS } from "@/utils/geohash";
import { Globe } from "lucide-react";

export default function PresetPanel() {
  const { applyPreset } = useGeoHashStore();

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-1">
        <Globe className="w-5 h-5 text-teal-400" />
        <h2 className="text-lg font-bold text-slate-100">预设点位</h2>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {PRESET_LOCATIONS.map((loc) => (
          <button
            key={loc.nameEn}
            onClick={() => applyPreset(loc.lat, loc.lng)}
            className="bg-slate-800/60 hover:bg-teal-900/30 border border-slate-700/50 hover:border-teal-700/50 rounded-lg px-3 py-2 text-left transition-all group"
          >
            <div className="text-xs text-slate-200 group-hover:text-teal-300 transition font-medium truncate">
              {loc.name}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
              {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
