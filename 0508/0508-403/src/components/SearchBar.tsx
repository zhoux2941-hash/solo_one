import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { stations } from '@/data/railwayConfig';
import { ArrowRightLeft, Search, X } from 'lucide-react';

export default function SearchBar() {
  const {
    routeFrom,
    routeTo,
    routeResult,
    setRouteFrom,
    setRouteTo,
    searchRoute,
    clearRoute,
    swapRouteInputs,
  } = useAppStore();

  const [fromDropdown, setFromDropdown] = useState(false);
  const [toDropdown, setToDropdown] = useState(false);
  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (fromRef.current && !fromRef.current.contains(e.target as Node)) {
        setFromDropdown(false);
      }
      if (toRef.current && !toRef.current.contains(e.target as Node)) {
        setToDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredFrom = stations.filter((s) =>
    s.name.includes(routeFrom)
  );
  const filteredTo = stations.filter((s) =>
    s.name.includes(routeTo)
  );

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900/90 backdrop-blur rounded-xl px-4 py-3 shadow-lg">
      <div ref={fromRef} className="relative">
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="起点站"
            value={routeFrom}
            onChange={(e) => {
              setRouteFrom(e.target.value);
              setFromDropdown(true);
            }}
            onFocus={() => setFromDropdown(true)}
            className="bg-transparent text-white text-sm outline-none w-28 placeholder:text-slate-500"
          />
          {routeFrom && (
            <button
              onClick={() => {
                setRouteFrom('');
                setFromDropdown(false);
              }}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {fromDropdown && routeFrom && filteredFrom.length > 0 && (
          <ul className="absolute top-full left-0 mt-1 bg-slate-800 rounded-lg shadow-lg max-h-48 overflow-y-auto w-full z-50">
            {filteredFrom.map((s) => (
              <li
                key={s.id}
                onClick={() => {
                  setRouteFrom(s.name);
                  setFromDropdown(false);
                }}
                className="px-3 py-2 text-sm text-white hover:bg-slate-700 cursor-pointer"
              >
                {s.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={swapRouteInputs}
        className="p-2 text-slate-400 hover:text-white transition-colors"
      >
        <ArrowRightLeft className="w-4 h-4" />
      </button>

      <div ref={toRef} className="relative">
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg px-3 py-2">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="终点站"
            value={routeTo}
            onChange={(e) => {
              setRouteTo(e.target.value);
              setToDropdown(true);
            }}
            onFocus={() => setToDropdown(true)}
            className="bg-transparent text-white text-sm outline-none w-28 placeholder:text-slate-500"
          />
          {routeTo && (
            <button
              onClick={() => {
                setRouteTo('');
                setToDropdown(false);
              }}
              className="text-slate-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {toDropdown && routeTo && filteredTo.length > 0 && (
          <ul className="absolute top-full left-0 mt-1 bg-slate-800 rounded-lg shadow-lg max-h-48 overflow-y-auto w-full z-50">
            {filteredTo.map((s) => (
              <li
                key={s.id}
                onClick={() => {
                  setRouteTo(s.name);
                  setToDropdown(false);
                }}
                className="px-3 py-2 text-sm text-white hover:bg-slate-700 cursor-pointer"
              >
                {s.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={searchRoute}
        className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
      >
        <Search className="w-4 h-4" />
      </button>

      {routeResult && (
        <button
          onClick={clearRoute}
          className="px-3 py-2 text-sm text-red-400 hover:text-red-300 transition-colors"
        >
          清除
        </button>
      )}
    </div>
  );
}
