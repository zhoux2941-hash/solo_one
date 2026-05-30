import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { roles } from '../data/roles';
import { RoleCard } from '../components/RoleCard';
import { Role } from '../types';
import { useGameStore } from '../store/useGameStore';
import { cn } from '../lib/utils';
import { Sparkles, BookOpen } from 'lucide-react';

export default function RoleSelect() {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const navigate = useNavigate();
  const selectRole = useGameStore((state) => state.selectRole);
  const currentRole = useGameStore((state) => state.currentRole);

  useEffect(() => {
    if (currentRole) {
      navigate('/parade');
    }
  }, [currentRole, navigate]);

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
  };

  const handleConfirm = () => {
    if (selectedRole) {
      selectRole(selectedRole, navigate);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-batik via-embroidery-red to-indigo-batik relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <defs>
              <pattern id="tie-dye-1" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="15" fill="none" stroke="#F5F0E1" strokeWidth="0.5" />
                <circle cx="20" cy="20" r="10" fill="none" stroke="#D4AF37" strokeWidth="0.3" />
                <circle cx="20" cy="20" r="5" fill="#D4AF37" opacity="0.3" />
              </pattern>
              <pattern id="tie-dye-2" x="20" y="20" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M0 30 Q15 15 30 30 Q45 45 60 30" fill="none" stroke="#F5F0E1" strokeWidth="0.5" opacity="0.5" />
                <path d="M0 40 Q20 25 40 40 Q60 55 80 40" fill="none" stroke="#D4AF37" strokeWidth="0.3" opacity="0.3" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#tie-dye-1)" />
            <rect width="100%" height="100%" fill="url(#tie-dye-2)" />
          </svg>
        </div>

        <div className="absolute top-20 left-10 w-64 h-64 bg-ivory/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gold/10 rounded-full blur-3xl animate-float-delay" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-embroidery-red/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 md:py-12">
        <header className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center space-x-2 bg-ivory/10 backdrop-blur-sm px-4 py-2 rounded-full border border-gold/30 mb-6">
            <Sparkles className="w-5 h-5 text-gold" />
            <span className="text-ivory/80 text-sm">国家级非物质文化遗产</span>
          </div>
          
          <h1 className="font-baicalligraphy text-4xl md:text-6xl text-ivory mb-4 tracking-wider">
            选择你的角色
          </h1>
          <p className="font-baicalligraphy text-2xl md:text-3xl text-gold mb-2">
            开启绕三灵之旅
          </p>
          <p className="text-ivory/70 text-lg max-w-2xl mx-auto">
            每一个角色都有独特的技能与故事，选择一位角色，踏上这神圣的文化之旅
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto mb-12">
          {roles.map((role, index) => (
            <div
              key={role.id}
              className={cn(
                "animate-fade-in-up",
                `animate-delay-${(index + 1) * 100}`
              )}
            >
              <RoleCard
                role={role}
                isSelected={selectedRole?.id === role.id}
                onSelect={handleRoleSelect}
              />
            </div>
          ))}
        </div>

        {selectedRole && (
          <div className="flex justify-center mb-12 animate-fade-in">
            <button
              onClick={handleConfirm}
              className="group relative px-12 py-4 bg-gradient-to-r from-gold via-yellow-400 to-gold text-indigo-batik font-bold text-lg rounded-2xl shadow-2xl hover:shadow-gold/50 transition-all duration-500 hover:scale-105 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <div className="relative flex items-center space-x-2">
                <Sparkles className="w-5 h-5" />
                <span>确认选择 {selectedRole.name}，开始旅程</span>
                <Sparkles className="w-5 h-5" />
              </div>
            </button>
          </div>
        )}

        <div className="max-w-4xl mx-auto">
          <div className="bg-ivory/10 backdrop-blur-md rounded-3xl p-6 md:p-8 border border-gold/20 animate-fade-in animate-delay-500">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-embroidery-red flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-ivory" />
              </div>
              <div>
                <h3 className="font-baicalligraphy text-2xl text-ivory mb-1">绕三灵文化简介</h3>
                <p className="text-ivory/60 text-sm">了解这一传承千年的白族传统节日</p>
              </div>
            </div>
            <div className="space-y-3 text-ivory/80 leading-relaxed">
              <p>
                绕三灵是云南省大理白族自治州的传统节日，国家级非物质文化遗产之一。
                每年农历四月二十三日至二十五日，白族人民身着盛装，汇聚于苍山洱海之滨，
                举行隆重的祭祀、对歌、打跳等活动，以祈求风调雨顺、国泰民安。
              </p>
              <p>
                "三灵指的是佛都、神都、仙都三座庙宇，
                队伍从洱海边的本主庙出发，依次朝拜三座庙宇，
                沿途歌舞，通宵达旦，
                是白族文化中最具代表性的传统文化活动之一。
              </p>
              <div className="flex flex-wrap gap-2 mt-4">
                <span className="px-3 py-1 bg-gold/20 text-gold rounded-full text-xs">🏯 本主信仰</span>
                <span className="px-3 py-1 bg-embroidery-red/20 text-ivory rounded-full text-xs">🎤 白族对歌</span>
                <span className="px-3 py-1 bg-cangshan-green/20 text-ivory rounded-full text-xs">💃 霸王鞭舞</span>
                <span className="px-3 py-1 bg-erhai-blue/20 text-ivory rounded-full text-xs">🏔️ 苍山洱海</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
