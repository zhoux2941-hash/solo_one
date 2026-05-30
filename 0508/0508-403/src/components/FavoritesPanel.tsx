import { useAppStore } from '@/store/useAppStore';
import { Star, Trash2, MapPin } from 'lucide-react';

export default function FavoritesPanel() {
  const favorites = useAppStore((s) => s.favorites);
  const removeFavorite = useAppStore((s) => s.removeFavorite);
  const loadFavRoute = useAppStore((s) => s.loadFavRoute);

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <Star className="w-10 h-10 mb-3 opacity-30" />
        <p className="text-sm">暂无收藏路线</p>
        <p className="text-xs mt-1">查询路线后点击星号收藏</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {favorites.map((fav) => (
        <li
          key={fav.id}
          className="group flex items-center gap-3 bg-slate-800/60 hover:bg-slate-700/60 rounded-lg px-4 py-3 transition-colors cursor-pointer"
          onClick={() => loadFavRoute(fav.fromStationId, fav.toStationId)}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-sm text-white truncate">{fav.fromName}</span>
            <span className="text-slate-500 text-xs">→</span>
            <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="text-sm text-white truncate">{fav.toName}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeFavorite(fav.id);
            }}
            className="p-1 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}
