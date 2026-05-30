import { useMemo, useState } from 'react';
import { temples } from '@/data/temples';
import { roles } from '@/data/roles';
import { tasks } from '@/data/tasks';
import { useGameStore } from '@/store/useGameStore';
import { TempleNode, TempleDetailModal } from '@/components/TempleNode';
import { TaskInteraction } from '@/components/TaskInteraction';
import { Temple, Role, Task, TaskInteractionResult } from '@/types';
import { cn } from '@/lib/utils';

export function RouteMap() {
  const { currentRole, currentTempleIndex, completedTemples, selectedTemple, selectTemple, completeTask } = useGameStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const role = useMemo(() => {
    return roles.find((r: Role) => r.id === currentRole?.id) || currentRole;
  }, [currentRole]);

  const sortedTemples = useMemo(() => {
    return [...temples].sort((a, b) => a.order - b.order);
  }, []);

  const currentTask = useMemo(() => {
    if (!currentRole || !selectedTemple) return null;
    return tasks.find((t: Task) => t.roleId === currentRole.id && t.templeId === selectedTemple.id) || null;
  }, [currentRole, selectedTemple]);

  const handleStartTask = () => {
    if (currentTask) {
      setActiveTask(currentTask);
      selectTemple(null);
    }
  };

  const handleTaskComplete = (result: TaskInteractionResult) => {
    if (activeTask && result.success) {
      completeTask(activeTask.id, activeTask.templeId);
    }
    setActiveTask(null);
  };

  const handleTaskCancel = () => {
    setActiveTask(null);
  };

  const pathData = useMemo(() => {
    const points = sortedTemples.map((temple) => ({
      x: temple.position.x,
      y: temple.position.y,
    }));

    if (points.length < 2) return '';

    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const midX = (current.x + next.x) / 2;
      const midY = (current.y + next.y) / 2;

      const dx = next.x - current.x;
      const dy = next.y - current.y;
      const perpX = -dy * 0.15;
      const perpY = dx * 0.15;

      const ctrlX = midX + perpX;
      const ctrlY = midY - Math.abs(perpY) - 5;

      d += ` Q ${ctrlX} ${ctrlY}, ${next.x} ${next.y}`;
    }

    return d;
  }, [sortedTemples]);

  const currentPosition = useMemo(() => {
    const currentTemple = sortedTemples[currentTempleIndex];
    if (!currentTemple) return sortedTemples[0]?.position || { x: 10, y: 70 };
    return currentTemple.position;
  }, [sortedTemples, currentTempleIndex]);

  const getTempleStatus = (temple: Temple): 'completed' | 'current' | 'upcoming' => {
    if (completedTemples.includes(temple.id)) return 'completed';
    if (temple.order === currentTempleIndex) return 'current';
    return 'upcoming';
  };

  const handleTempleClick = (temple: Temple) => {
    selectTemple(temple);
  };

  const handleCloseModal = () => {
    selectTemple(null);
  };

  return (
    <div className="relative w-full h-full">
      <svg
        id="route-map"
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{
          background: 'linear-gradient(180deg, #87CEEB 0%, #E0F7FA 30%, #F5F0E1 60%, #2D5016 100%)',
        }}
      >
        <defs>
          <linearGradient id="cangshan-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4A6741" />
            <stop offset="50%" stopColor="#2D5016" />
            <stop offset="100%" stopColor="#1A3009" />
          </linearGradient>

          <linearGradient id="erhai-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4A90A4" />
            <stop offset="100%" stopColor="#2C5F6E" />
          </linearGradient>

          <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C41E3A" />
            <stop offset="50%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#C41E3A" />
          </linearGradient>

          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="0.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="soft-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0.5" stdDeviation="0.5" floodColor="#000" floodOpacity="0.3" />
          </filter>

          <pattern id="wave-pattern" patternUnits="userSpaceOnUse" width="10" height="2" patternTransform="scale(0.5)">
            <path d="M0,1 Q2.5,0 5,1 T10,1" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="0.3" />
          </pattern>
        </defs>

        {/* 远山 - 苍山 */}
        <g className="animate-fade-in">
          <path
            d="M0,35 L10,20 L20,28 L30,15 L40,22 L50,10 L60,18 L70,12 L80,20 L90,16 L100,25 L100,40 L0,40 Z"
            fill="url(#cangshan-gradient)"
            opacity="0.6"
          />
          <path
            d="M0,40 L15,25 L25,32 L35,20 L45,28 L55,18 L65,25 L75,20 L85,28 L95,22 L100,30 L100,45 L0,45 Z"
            fill="url(#cangshan-gradient)"
            opacity="0.8"
          />

          {/* 山顶积雪 */}
          <path
            d="M48,12 L50,10 L52,12 L55,18 L45,18 Z"
            fill="rgba(255,255,255,0.7)"
          />
          <path
            d="M68,14 L70,12 L72,14 L75,20 L65,20 Z"
            fill="rgba(255,255,255,0.6)"
          />
          <path
            d="M88,18 L90,16 L92,18 L95,22 L85,22 Z"
            fill="rgba(255,255,255,0.5)"
          />
        </g>

        {/* 云朵 */}
        <g className="animate-float">
          <ellipse cx="20" cy="8" rx="4" ry="1.5" fill="white" opacity="0.8" />
          <ellipse cx="23" cy="7" rx="3" ry="1.2" fill="white" opacity="0.9" />
          <ellipse cx="18" cy="7.5" rx="2.5" ry="1" fill="white" opacity="0.85" />
        </g>
        <g className="animate-float-delay">
          <ellipse cx="75" cy="10" rx="5" ry="1.8" fill="white" opacity="0.7" />
          <ellipse cx="78" cy="9" rx="3.5" ry="1.4" fill="white" opacity="0.8" />
          <ellipse cx="72" cy="9.5" rx="3" ry="1.2" fill="white" opacity="0.75" />
        </g>

        {/* 洱海 */}
        <g className="animate-fade-in animate-delay-200">
          <path
            d="M0,55 Q15,50 30,52 Q45,54 55,50 Q70,46 85,50 Q95,52 100,55 L100,75 Q85,80 70,78 Q55,76 40,78 Q25,80 10,78 Q0,76 0,75 Z"
            fill="url(#erhai-gradient)"
          />
          <path
            d="M0,55 Q15,50 30,52 Q45,54 55,50 Q70,46 85,50 Q95,52 100,55 L100,75 Q85,80 70,78 Q55,76 40,78 Q25,80 10,78 Q0,76 0,75 Z"
            fill="url(#wave-pattern)"
          />

          {/* 湖面波光 */}
          <circle cx="30" cy="60" r="0.5" fill="white" opacity="0.6" className="animate-pulse" />
          <circle cx="50" cy="65" r="0.4" fill="white" opacity="0.5" className="animate-pulse animate-delay-200" />
          <circle cx="70" cy="58" r="0.6" fill="white" opacity="0.7" className="animate-pulse animate-delay-500" />
          <circle cx="45" cy="70" r="0.4" fill="white" opacity="0.4" className="animate-pulse animate-delay-300" />
        </g>

        {/* 岸边草地 */}
        <path
          d="M0,75 Q25,72 50,74 Q75,76 100,72 L100,85 L0,85 Z"
          fill="#4A7C23"
          opacity="0.8"
        />
        <path
          d="M0,82 Q30,80 50,81 Q70,82 100,80 L100,100 L0,100 Z"
          fill="#2D5016"
        />

        {/* 路径轨迹 - 已完成部分 */}
        {pathData && (
          <>
            <path
              d={pathData}
              fill="none"
              stroke="#D4AF37"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.4"
              strokeDasharray="1 1"
            />

            <path
              d={pathData}
              fill="none"
              stroke="url(#path-gradient)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
            />

            {/* 流动动画 */}
            <path
              d={pathData}
              fill="none"
              stroke="white"
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeDasharray="3 6"
              opacity="0.8"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="-18"
                dur="2s"
                repeatCount="indefinite"
              />
            </path>
          </>
        )}

        {/* 庙宇节点 */}
        {sortedTemples.map((temple, index) => (
          <g
            key={temple.id}
            className={cn(
              'transition-opacity duration-500',
              index <= currentTempleIndex ? 'opacity-100' : 'opacity-70'
            )}
            style={{ animationDelay: `${index * 200}ms` }}
          >
            <TempleNode
              temple={temple}
              status={getTempleStatus(temple)}
              onClick={handleTempleClick}
            />
          </g>
        ))}

        {/* 角色标记 */}
        {role && (
          <g
            className="transition-all duration-1000 ease-out"
            style={{
              transform: `translate(${currentPosition.x}px, ${currentPosition.y - 8}px)`,
            }}
          >
            {/* 角色光晕 */}
            <circle
              cx="0"
              cy="0"
              r="5"
              fill={role.color}
              opacity="0.3"
              className="animate-pulse-slow"
            />
            <circle
              cx="0"
              cy="0"
              r="3.5"
              fill={role.color}
              opacity="0.5"
              className="animate-pulse"
            />

            {/* 角色头像 */}
            <circle
              cx="0"
              cy="0"
              r="3"
              fill="#F5F0E1"
              stroke={role.color}
              strokeWidth="0.5"
            />
            <text
              x="0"
              y="1"
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[3px] select-none"
            >
              {role.avatar}
            </text>

            {/* 角色名称标签 */}
            <g transform="translate(0, 6)">
              <rect
                x="-10"
                y="-2"
                width="20"
                height="5"
                rx="1"
                fill={role.color}
                opacity="0.9"
              />
              <text
                x="0"
                y="1.5"
                textAnchor="middle"
                className="text-[2.5px] font-bold select-none fill-white"
                style={{ fontFamily: '"Noto Serif SC", serif' }}
              >
                {role.name}
              </text>
            </g>
          </g>
        )}

        {/* 装饰性元素 - 飞鸟 */}
        <g className="animate-float animate-delay-700">
          <path d="M15,25 Q17,23 19,25 Q21,23 23,25" fill="none" stroke="#1E3A5F" strokeWidth="0.5" />
        </g>
        <g className="animate-float-delay">
          <path d="M80,30 Q82,28 84,30 Q86,28 88,30" fill="none" stroke="#1E3A5F" strokeWidth="0.5" />
        </g>

        {/* 装饰性元素 - 小船 */}
        <g className="animate-float" style={{ animationDuration: '8s' }}>
          <path d="M40,68 L44,66 L48,68 L44,70 Z" fill="#8B4513" />
          <path d="M44,66 L44,62 L46,64 Z" fill="#F5F0E1" />
        </g>
      </svg>

      {/* 地图图例 */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-gold/30">
        <h4 className="font-baicalligraphy text-sm text-indigo-batik mb-2">巡游路线</h4>
        <div className="space-y-1.5">
          {sortedTemples.map((temple) => (
            <div key={temple.id} className="flex items-center space-x-2">
              <div
                className={cn(
                  'w-2.5 h-2.5 rounded-full border-2',
                  getTempleStatus(temple) === 'completed' && 'bg-cangshan-green border-cangshan-green',
                  getTempleStatus(temple) === 'current' && 'bg-embroidery-red border-embroidery-red animate-pulse',
                  getTempleStatus(temple) === 'upcoming' && 'bg-gray-200 border-gray-400'
                )}
              />
              <span
                className={cn(
                  'text-xs',
                  getTempleStatus(temple) === 'completed' && 'text-cangshan-green',
                  getTempleStatus(temple) === 'current' && 'text-embroidery-red font-medium',
                  getTempleStatus(temple) === 'upcoming' && 'text-gray-500'
                )}
              >
                {temple.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 庙宇详情弹窗 */}
      {selectedTemple && (
        <TempleDetailModal
          temple={selectedTemple}
          status={getTempleStatus(selectedTemple)}
          onClose={handleCloseModal}
          onStart={handleStartTask}
        />
      )}

      {/* 任务交互弹窗 */}
      {activeTask && (
        <TaskInteraction
          task={activeTask}
          onComplete={handleTaskComplete}
          onCancel={handleTaskCancel}
        />
      )}
    </div>
  );
}
