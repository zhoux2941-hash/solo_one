import { PresetScene } from '../../engine/types';
import { PRESET_SCENES } from '../../engine/constants';
import { Flame, Droplets, Settings } from 'lucide-react';

interface PresetScenesProps {
  onSelect: (scene: PresetScene) => void;
  disabled?: boolean;
}

const sceneIcons: Record<string, React.ReactNode> = {
  'dry-windy': <Flame className="w-4 h-4" />,
  'wet-calm': <Droplets className="w-4 h-4" />,
  'default': <Settings className="w-4 h-4" />,
};

export function PresetScenes({ onSelect, disabled = false }: PresetScenesProps) {
  const scenes = Object.entries(PRESET_SCENES) as [PresetScene, typeof PRESET_SCENES[string]][];

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
        <Settings className="w-4 h-4" />
        预设场景
      </label>
      <div className="grid grid-cols-1 gap-2">
        {scenes.map(([key, scene]) => (
          <button
            key={key}
            onClick={() => !disabled && onSelect(key)}
            disabled={disabled}
            className="flex items-center gap-3 p-3 rounded-lg
              bg-slate-700/50 hover:bg-slate-700 
              border border-slate-600/50 hover:border-emerald-500/50
              transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed
              group"
          >
            <div className="w-8 h-8 rounded-full bg-slate-600 group-hover:bg-emerald-500/20 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 transition-colors">
              {sceneIcons[key]}
            </div>
            <div className="text-left flex-1">
              <div className="text-sm font-medium text-white">{scene.name}</div>
              <div className="text-xs text-slate-400">{scene.description}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
