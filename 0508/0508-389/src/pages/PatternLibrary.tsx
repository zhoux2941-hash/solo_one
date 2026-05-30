import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Plus } from 'lucide-react';
import { getPatterns, type Pattern } from '@/utils/api';
const categories = [
  { value: '', label: '全部' },
  { value: 'natural', label: '自然' },
  { value: 'geometric', label: '几何' },
  { value: 'animal', label: '动物' },
  { value: 'plant', label: '植物' },
];
const categoryNames: Record<string, string> = {
  natural: '自然',
  geometric: '几何',
  animal: '动物',
  plant: '植物',
};
export default function PatternLibrary() {
  const [patterns, setPatterns] = useState<Pattern[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadPatterns();
  }, [selectedCategory, searchQuery]);
  const loadPatterns = async () => {
    setLoading(true);
    try {
      const data = await getPatterns(selectedCategory, searchQuery);
      setPatterns(data);
    } catch (error) {
      console.error('Failed to load patterns:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-[#F5F0E8]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-[#1A2332] mb-2">纹样库</h2>
          <p className="text-[#1A2332]/70">选择基础纹样开始创作你的蜡染图案</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1A2332]/50" />
            <input
              type="text"
              placeholder="搜索纹样..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-[#1A2332]/10 bg-white focus:outline-none focus:ring-2 focus:ring-[#D4A84B] transition-all"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === cat.value
                    ? 'bg-[#D4A84B] text-[#1A2332]'
                    : 'bg-white text-[#1A2332]/70 hover:bg-[#1A2332]/5'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="aspect-square bg-white rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {patterns.map((pattern) => (
              <PatternCard key={pattern.id} pattern={pattern} />
            ))}
          </div>
        )}
        {!loading && patterns.length === 0 && (
          <div className="text-center py-16">
            <p className="text-[#1A2332]/50 text-lg">没有找到匹配的纹样</p>
          </div>
        )}
      </div>
    </div>
  );
}
function PatternCard({ pattern }: { pattern: Pattern }) {
  return (
    <Link
      to={`/editor?pattern=${pattern.id}`}
      className="group bg-white rounded-xl p-4 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
    >
      <div className="aspect-square bg-[#F5F0E8] rounded-lg mb-3 flex items-center justify-center overflow-hidden">
        <svg
          viewBox="0 0 100 100"
          className="w-3/4 h-3/4"
          style={{ fill: 'none', stroke: '#1A2332', strokeWidth: 2 }}
        >
          <path d={pattern.svg_path} />
        </svg>
      </div>
      <h3 className="font-medium text-[#1A2332] mb-1">{pattern.name}</h3>
      <div className="flex items-center justify-between">
        <span className="text-xs px-2 py-1 bg-[#1A2332]/5 rounded text-[#1A2332]/70">
          {categoryNames[pattern.category] || pattern.category}
        </span>
        <div className="w-8 h-8 rounded-full bg-[#D4A84B]/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Plus className="w-4 h-4 text-[#D4A84B]" />
        </div>
      </div>
    </Link>
  );
}
