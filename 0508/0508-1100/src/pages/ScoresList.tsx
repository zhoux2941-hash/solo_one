import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Music,
  ChevronRight,
  Clock,
  User,
  BookOpen,
  Sparkles,
  AlertTriangle,
  Layers,
} from 'lucide-react';
import { api } from '../lib/api';
import { useStore } from '../store';
import type { Score, Teacher } from '../types';

const DIFFICULTY_LABELS: Record<Score['difficulty'], string> = {
  elementary: '初级',
  intermediate: '中级',
  advanced: '高级',
};

const DIFFICULTY_STYLES: Record<Score['difficulty'], string> = {
  elementary: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  intermediate: 'bg-amber-50 text-amber-700 border-amber-200',
  advanced: 'bg-rose-50 text-rose-700 border-rose-200',
};

const FILTERS: Array<{ key: 'all' | Score['difficulty']; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'elementary', label: '初级' },
  { key: 'intermediate', label: '中级' },
  { key: 'advanced', label: '高级' },
];

function ScoreCard({ score }: { score: Score }) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate(`/score/${score.id}`)}
      className="group relative text-left bg-[#FBF7EE] border border-[#E8DDC9] rounded-lg p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#4A3728] via-[#C84B31] to-[#4A3728] opacity-70 group-hover:opacity-100 transition-opacity" />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-lg font-semibold text-[#2B1F14] truncate">
            {score.title}
          </h3>
          <p className="mt-1 text-sm text-[#6B5A46] truncate">{score.composer}</p>
        </div>
        <span
          className={`shrink-0 inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${DIFFICULTY_STYLES[score.difficulty]}`}
        >
          {DIFFICULTY_LABELS[score.difficulty]}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-4 text-xs text-[#6B5A46]">
        <span className="inline-flex items-center gap-1.5">
          <Music size={14} />
          {score.instrument}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock size={14} />
          {new Date(score.updatedAt).toLocaleDateString('zh-CN')}
        </span>
      </div>

      <div className="mt-5 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs text-[#6B5A46]">
          <User size={14} />
          <BookOpen size={14} className="ml-1" />
          回看台
        </span>
        <ChevronRight
          size={18}
          className="text-[#6B5A46] group-hover:text-[#C84B31] group-hover:translate-x-0.5 transition-all"
        />
      </div>
    </button>
  );
}

function ScoreCardSkeleton() {
  return (
    <div className="bg-[#FBF7EE] border border-[#E8DDC9] rounded-lg p-5 shadow-sm animate-pulse">
      <div className="h-5 bg-[#E8DDC9] rounded w-3/4 mb-3" />
      <div className="h-4 bg-[#EDE3CF] rounded w-1/2 mb-4" />
      <div className="h-3 bg-[#EDE3CF] rounded w-2/3 mb-2" />
      <div className="h-3 bg-[#EDE3CF] rounded w-1/3" />
    </div>
  );
}

const TEACHER_COLORS = [
  '#C84B31',
  '#4A6741',
  '#2D5016',
  '#8B4513',
  '#5D4E37',
  '#3E5C76',
  '#6B4423',
  '#704214',
];

function getTeacherColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TEACHER_COLORS[Math.abs(hash) % TEACHER_COLORS.length];
}

function TeacherCard({ teacher }: { teacher: Teacher }) {
  const navigate = useNavigate();
  const color = getTeacherColor(teacher.id);
  const initial = teacher.name.charAt(0);

  return (
    <button
      type="button"
      onClick={() => navigate(`/teacher/${teacher.id}`)}
      className="group relative text-left bg-[#FBF7EE] border border-[#E8DDC9] rounded-lg p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden"
    >
      <div className="absolute inset-x-0 top-0 h-1 opacity-70 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: color }} />
      <div className="flex items-start gap-4">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-white font-serif text-xl font-semibold shrink-0"
          style={{ backgroundColor: color }}
        >
          {initial}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-serif text-lg font-semibold text-[#2B1F14] truncate">
            {teacher.name}
          </h3>
          {teacher.title && (
            <p className="mt-0.5 text-sm text-[#6B5A46] truncate">{teacher.title}</p>
          )}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-[#4A3728]">
            <BookOpen size={16} />
            <span className="font-semibold text-lg">{teacher.scoreCount}</span>
          </div>
          <p className="text-xs text-[#6B5A46] mt-0.5">曲谱数</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-[#4A3728]">
            <Layers size={16} />
            <span className="font-semibold text-lg">{teacher.annotationCount}</span>
          </div>
          <p className="text-xs text-[#6B5A46] mt-0.5">批注数</p>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-[#C84B31]">
            <AlertTriangle size={16} />
            <span className="font-semibold text-lg">{teacher.conflictCount}</span>
          </div>
          <p className="text-xs text-[#6B5A46] mt-0.5">冲突数</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-[#E8DDC9] flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 text-xs text-[#6B5A46]">
          <Clock size={14} />
          最早批注 {new Date(teacher.createdAt).toLocaleDateString('zh-CN')}
        </span>
        <ChevronRight
          size={18}
          className="text-[#6B5A46] group-hover:text-[#C84B31] group-hover:translate-x-0.5 transition-all"
        />
      </div>
    </button>
  );
}

function TeacherCardSkeleton() {
  return (
    <div className="bg-[#FBF7EE] border border-[#E8DDC9] rounded-lg p-5 shadow-sm animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-[#E8DDC9]" />
        <div className="flex-1">
          <div className="h-5 bg-[#E8DDC9] rounded w-1/2 mb-2" />
          <div className="h-4 bg-[#EDE3CF] rounded w-2/3" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="h-10 bg-[#EDE3CF] rounded" />
        <div className="h-10 bg-[#EDE3CF] rounded" />
        <div className="h-10 bg-[#EDE3CF] rounded" />
      </div>
      <div className="mt-4 pt-4 border-t border-[#E8DDC9]">
        <div className="h-4 bg-[#EDE3CF] rounded w-2/3" />
      </div>
    </div>
  );
}

export default function ScoresList() {
  const {
    scores,
    setScores,
    setLoading,
    loading,
    viewMode,
    teachers,
    setViewMode,
    setTeachers,
  } = useStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | Score['difficulty']>('all');

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const loadData = async () => {
      try {
        if (viewMode === 'byScore') {
          const data = await api.getScores();
          if (mounted) setScores(data);
        } else {
          const data = await api.getTeachers();
          if (mounted) setTeachers(data);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, [viewMode, setScores, setTeachers, setLoading]);

  const filteredScores = useMemo(() => {
    return scores.filter((s) => {
      const matchQuery = query
        ? s.title.toLowerCase().includes(query.trim().toLowerCase()) ||
          s.composer.toLowerCase().includes(query.trim().toLowerCase())
        : true;
      const matchDifficulty = filter === 'all' ? true : s.difficulty === filter;
      return matchQuery && matchDifficulty;
    });
  }, [scores, query, filter]);

  const filteredTeachers = useMemo(() => {
    return (teachers as unknown as Teacher[]).filter((t) => {
      if (!query) return true;
      const q = query.trim().toLowerCase();
      return t.name.toLowerCase().includes(q);
    });
  }, [teachers, query]);

  const VIEW_MODES = [
    { key: 'byScore' as const, label: '按曲目', icon: Music },
    { key: 'byTeacher' as const, label: '按老师', icon: User },
  ];

  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      <header className="sticky top-0 z-10 border-b border-[#E8DDC9] bg-[#F5F0E6]/90 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded-md bg-[#4A3728] text-[#F5F0E6]">
            <Sparkles size={18} />
          </div>
          <h1 className="font-serif text-xl font-semibold text-[#2B1F14]">
            曲谱批注回看台
          </h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="inline-flex items-center rounded-md border border-[#E8DDC9] bg-[#FBF7EE] p-1 mb-6">
          {VIEW_MODES.map((vm) => {
            const Icon = vm.icon;
            return (
              <button
                key={vm.key}
                type="button"
                onClick={() => setViewMode(vm.key)}
                className={`inline-flex items-center gap-2 px-4 py-2 text-sm rounded transition-colors ${
                  viewMode === vm.key
                    ? 'bg-[#4A3728] text-[#F5F0E6]'
                    : 'text-[#6B5A46] hover:bg-[#EDE3CF]'
                }`}
              >
                <Icon size={16} />
                {vm.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-xl">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B5A46]"
            />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                viewMode === 'byScore'
                  ? '按曲名或作曲者搜索...'
                  : '按老师姓名搜索...'
              }
              className="w-full h-10 pl-9 pr-3 rounded-md border border-[#E8DDC9] bg-[#FBF7EE] text-sm text-[#2B1F14] placeholder:text-[#A59881] focus:outline-none focus:ring-2 focus:ring-[#C84B31]/30 focus:border-[#C84B31]"
            />
          </div>

          {viewMode === 'byScore' && (
            <div className="inline-flex items-center rounded-md border border-[#E8DDC9] bg-[#FBF7EE] p-1">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  type="button"
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 text-sm rounded transition-colors ${
                    filter === f.key
                      ? 'bg-[#4A3728] text-[#F5F0E6]'
                      : 'text-[#6B5A46] hover:bg-[#EDE3CF]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {viewMode === 'byScore' ? (
          <>
            {loading && scores.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ScoreCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredScores.length === 0 ? (
              <div className="py-24 text-center text-[#6B5A46]">
                <Music size={40} className="mx-auto mb-3 opacity-40" />
                <p>暂无符合条件的曲谱</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredScores.map((score) => (
                  <ScoreCard key={score.id} score={score} />
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {loading && teachers.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <TeacherCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredTeachers.length === 0 ? (
              <div className="py-24 text-center text-[#6B5A46]">
                <User size={40} className="mx-auto mb-3 opacity-40" />
                <p>暂无符合条件的老师</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTeachers.map((teacher) => (
                  <TeacherCard key={teacher.id} teacher={teacher as Teacher} />
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
