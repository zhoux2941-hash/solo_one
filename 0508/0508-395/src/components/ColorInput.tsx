import { useState, useEffect } from 'react';
import { Search, Sliders, Type, Hash } from 'lucide-react';
import { useColorStore } from '../store/colorStore';
import { colorApi } from '../utils/api';
import { useDebounce, validateRgbInput, validateCmykInput, formatPantoneCode } from '../utils/helpers';
import type { InputMode } from '@shared/types';
import ColorSwatch from './ColorSwatch';

const inputModes: { key: InputMode; label: string; icon: typeof Sliders }[] = [
  { key: 'rgb', label: 'RGB', icon: Sliders },
  { key: 'cmyk', label: 'CMYK', icon: Sliders },
  { key: 'hex', label: 'HEX', icon: Hash },
  { key: 'pantone', label: 'Pantone', icon: Type },
];

export default function ColorInput() {
  const {
    inputMode,
    currentRgb,
    currentCmyk,
    currentHex,
    currentPantoneCode,
    presetColors,
    searchResults,
    searchQuery,
    setInputMode,
    setRgb,
    setCmyk,
    setHex,
    setPantoneCode,
    setConversionResult,
    setSearchResults,
    setSearchQuery,
    setIsLoading,
    setError,
  } = useColorStore();

  const [localPantone, setLocalPantone] = useState(currentPantoneCode);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const debouncedRgb = useDebounce(currentRgb, 200);
  const debouncedCmyk = useDebounce(currentCmyk, 200);
  const debouncedHex = useDebounce(currentHex, 200);

  useEffect(() => {
    const convertColor = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let result;
        switch (inputMode) {
          case 'rgb':
            result = await colorApi.convertRgb(debouncedRgb);
            break;
          case 'cmyk':
            result = await colorApi.convertCmyk(debouncedCmyk);
            break;
          case 'hex':
            result = await colorApi.convertHex(debouncedHex);
            break;
          case 'pantone':
            result = await colorApi.convertPantone(formatPantoneCode(currentPantoneCode));
            break;
        }
        setConversionResult(result);
      } catch (err: any) {
        setError(err.response?.data?.error || '转换失败');
      } finally {
        setIsLoading(false);
      }
    };

    convertColor();
  }, [inputMode, debouncedRgb, debouncedCmyk, debouncedHex, currentPantoneCode]);

  useEffect(() => {
    if (debouncedSearch.length > 0) {
      colorApi.searchPantone(debouncedSearch)
        .then(res => setSearchResults(res.results))
        .catch(() => setSearchResults([]));
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch]);

  const handleRgbChange = (channel: 'r' | 'g' | 'b', value: string) => {
    const num = validateRgbInput(value);
    const newRgb = { ...currentRgb, [channel]: num };
    setRgb(newRgb);
  };

  const handleCmykChange = (channel: 'c' | 'm' | 'y' | 'k', value: string) => {
    const num = validateCmykInput(value);
    const newCmyk = { ...currentCmyk, [channel]: num };
    setCmyk(newCmyk);
  };

  const handlePantoneSubmit = () => {
    setPantoneCode(formatPantoneCode(localPantone));
  };

  const handlePresetClick = (code: string) => {
    setPantoneCode(code);
    setInputMode('pantone');
  };

  const handleSearchResultClick = (code: string) => {
    setPantoneCode(code);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-slate-800">颜色输入</h2>
        <div className="flex items-center space-x-1 bg-slate-100 rounded-xl p-1">
          {inputModes.map((mode) => (
            <button
              key={mode.key}
              onClick={() => setInputMode(mode.key)}
              className={`
                flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium
                transition-all duration-200
                ${inputMode === mode.key
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
                }
              `}
            >
              <mode.icon className="w-3.5 h-3.5" />
              <span>{mode.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {inputMode === 'rgb' && (
          <div className="space-y-5">
            {(['r', 'g', 'b'] as const).map((channel) => (
              <div key={channel} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    {channel}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="255"
                    value={currentRgb[channel]}
                    onChange={(e) => handleRgbChange(channel, e.target.value)}
                    className="w-20 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-right text-slate-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="255"
                  value={currentRgb[channel]}
                  onChange={(e) => handleRgbChange(channel, e.target.value)}
                  className={`
                    w-full h-2 rounded-lg appearance-none cursor-pointer
                    ${channel === 'r' ? 'accent-red-500' : channel === 'g' ? 'accent-green-500' : 'accent-blue-500'}
                  `}
                  style={{
                    background: `linear-gradient(to right, 
                      ${channel === 'r' ? '#fee2e2' : channel === 'g' ? '#dcfce7' : '#dbeafe'}, 
                      ${channel === 'r' ? '#ef4444' : channel === 'g' ? '#22c55e' : '#3b82f6'})`
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {inputMode === 'cmyk' && (
          <div className="space-y-5">
            {(['c', 'm', 'y', 'k'] as const).map((channel) => (
              <div key={channel} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                    {channel} (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={currentCmyk[channel]}
                    onChange={(e) => handleCmykChange(channel, e.target.value)}
                    className="w-20 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-right text-slate-800 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                  />
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="0.1"
                  value={currentCmyk[channel]}
                  onChange={(e) => handleCmykChange(channel, e.target.value)}
                  className={`
                    w-full h-2 rounded-lg appearance-none cursor-pointer
                    ${channel === 'c' ? 'accent-cyan-500' : 
                      channel === 'm' ? 'accent-fuchsia-500' : 
                      channel === 'y' ? 'accent-yellow-500' : 'accent-slate-700'}
                  `}
                />
              </div>
            ))}
          </div>
        )}

        {inputMode === 'hex' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">HEX 值</label>
              <div className="flex items-center space-x-3">
                <span className="text-slate-500 font-mono text-xl font-bold">#</span>
                <input
                  type="text"
                  value={currentHex.replace('#', '')}
                  onChange={(e) => setHex('#' + e.target.value.toUpperCase())}
                  placeholder="FF0000"
                  maxLength={6}
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-lg uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                />
                <div
                  className="w-14 h-14 rounded-xl border-2 border-slate-200 shadow-inner"
                  style={{ backgroundColor: currentHex }}
                />
              </div>
            </div>
          </div>
        )}

        {inputMode === 'pantone' && (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Pantone 色号</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={localPantone}
                  onChange={(e) => setLocalPantone(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handlePantoneSubmit()}
                  placeholder="PANTONE 185 C"
                  className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                />
                <button
                  onClick={handlePantoneSubmit}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-indigo-500/25"
                >
                  转换
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 flex items-center space-x-2">
                <Search className="w-4 h-4" />
                <span>搜索色卡</span>
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="输入色号、色名搜索..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
              />
              
              {searchResults.length > 0 && (
                <div className="mt-2 max-h-48 overflow-y-auto bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-lg">
                  {searchResults.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => handleSearchResultClick(color.pantoneCode)}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-indigo-50 transition-colors text-left"
                    >
                      <div
                        className="w-10 h-10 rounded-lg shadow-md border border-white"
                        style={{ backgroundColor: color.hex }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{color.pantoneCode}</p>
                        <p className="text-xs text-slate-500 truncate">{color.nameZh} · {color.name}</p>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">{color.hex}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-200">
              <p className="text-sm font-semibold text-slate-700">常用专色</p>
              <div className="flex flex-wrap gap-2">
                {presetColors.slice(0, 8).map((color) => (
                  <button
                    key={color.id}
                    onClick={() => handlePresetClick(color.pantoneCode)}
                    className="group relative"
                  >
                    <ColorSwatch
                      hex={color.hex}
                      size="sm"
                      className="transition-transform group-hover:scale-110"
                    />
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-medium">
                      {color.pantoneCode.split(' ')[1]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
