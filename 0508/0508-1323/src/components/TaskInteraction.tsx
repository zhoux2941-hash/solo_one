import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  MousePointer2,
  Hand,
  ArrowRight,
  Music,
  Timer,
  Trophy,
  Star,
  Zap,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { Task, InteractionType, TaskInteractionResult } from '@/types';
import { useGameStore } from '@/store/useGameStore';
import { roles } from '@/data/roles';
import { cn } from '@/lib/utils';

interface TaskInteractionProps {
  task: Task;
  onComplete: (result: TaskInteractionResult) => void;
  onCancel: () => void;
}

const INTERACTION_TYPE_MAP: Record<string, InteractionType> = {
  祭祀: 'hold',
  对歌: 'rhythm',
  打跳: 'click',
  讲述: 'sequence',
  祈福: 'hold',
};

const SEQUENCE_SYMBOLS = ['🌸', '🎋', '⛩️', '🎭', '🪘', '🎨'];

const INTERACTION_CONFIG: Record<InteractionType, { targetCount: number; timeLimit: number; holdDuration?: number; rhythmPattern?: number[] }> = {
  click: { targetCount: 30, timeLimit: 10 },
  hold: { targetCount: 1, timeLimit: 10, holdDuration: 3000 },
  sequence: { targetCount: 5, timeLimit: 15 },
  rhythm: { targetCount: 8, timeLimit: 12, rhythmPattern: [800, 600, 800, 600, 1000, 600, 800, 600] },
};

export function TaskInteraction({ task, onComplete, onCancel }: TaskInteractionProps) {
  const { currentRole, addMerit } = useGameStore();
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'finished'>('ready');
  const [timeLeft, setTimeLeft] = useState(0);
  const [progress, setProgress] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [clickCount, setClickCount] = useState(0);
  const [holdProgress, setHoldProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [sequence, setSequence] = useState<string[]>([]);
  const [currentSequenceIndex, setCurrentSequenceIndex] = useState(0);
  const [rhythmIndex, setRhythmIndex] = useState(0);
  const [rhythmActive, setRhythmActive] = useState(false);
  const [rhythmHits, setRhythmHits] = useState<boolean[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showFail, setShowFail] = useState(false);
  const [earnedMerit, setEarnedMerit] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [accuracy, setAccuracy] = useState(100);

  const rhythmHitsRef = useRef<boolean[]>([]);
  const gameStateRef = useRef(gameState);
  const startTimeRef = useRef(startTime);
  const maxComboRef = useRef(maxCombo);
  const timeLeftRef = useRef(timeLeft);
  const progressRef = useRef(progress);
  const accuracyRef = useRef(accuracy);
  const isHoldingRef = useRef(isHolding);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    startTimeRef.current = startTime;
  }, [startTime]);

  useEffect(() => {
    maxComboRef.current = maxCombo;
  }, [maxCombo]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    accuracyRef.current = accuracy;
  }, [accuracy]);

  useEffect(() => {
    isHoldingRef.current = isHolding;
  }, [isHolding]);

  const interactionType = useMemo(() => {
    return INTERACTION_TYPE_MAP[task.interactionType] || 'click';
  }, [task.interactionType]);

  const config = useMemo(() => {
    return INTERACTION_CONFIG[interactionType];
  }, [interactionType]);

  const skillBonus = useMemo(() => {
    if (!currentRole) return 1;
    const role = roles.find((r) => r.id === currentRole.id);
    if (!role) return 1;

    if (role.id === 'elder' && (interactionType === 'hold' || task.interactionType === '祭祀')) {
      return 1.5;
    }
    if (role.id === 'jinhua' && (interactionType === 'sequence' || task.interactionType === '对歌')) {
      return 1.5;
    }
    if (role.id === 'apeng' && (interactionType === 'rhythm' || task.interactionType === '打跳')) {
      return 1.3;
    }
    return 1;
  }, [currentRole, interactionType, task.interactionType]);

  const endGame = useCallback(
    (success: boolean) => {
      if (gameStateRef.current === 'finished') return;
      setGameState('finished');

      const timeTaken = (Date.now() - startTimeRef.current) / 1000;
      const finalCombo = maxComboRef.current;

      let finalMerit = 0;
      if (success) {
        const timeBonus = Math.max(0, (timeLeftRef.current / config.timeLimit) * 0.3);
        const comboBonus = Math.min(finalCombo * 0.02, 0.3);
        const baseMerit = task.meritReward;
        finalMerit = Math.round(baseMerit * (1 + timeBonus + comboBonus) * skillBonus);

        setEarnedMerit(finalMerit);
        setShowSuccess(true);
        addMerit(finalMerit);
      } else {
        setShowFail(true);
      }

      const result: TaskInteractionResult = {
        success,
        score: success ? Math.round((progressRef.current / config.targetCount) * 100) : 0,
        meritEarned: finalMerit,
        timeTaken,
        combo: finalCombo,
        accuracy: accuracyRef.current,
      };

      setTimeout(() => {
        onComplete(result);
      }, 2500);
    },
    [config.timeLimit, config.targetCount, task.meritReward, skillBonus, addMerit, onComplete]
  );

  useEffect(() => {
    if (interactionType === 'sequence' && gameState === 'ready') {
      const newSequence = Array.from({ length: config.targetCount }, () =>
        SEQUENCE_SYMBOLS[Math.floor(Math.random() * SEQUENCE_SYMBOLS.length)]
      );
      setSequence(newSequence);
    }
  }, [interactionType, gameState, config.targetCount]);

  useEffect(() => {
    if (gameState !== 'playing') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          endGame(false);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => clearInterval(timer);
  }, [gameState, endGame]);

  useEffect(() => {
    if (gameState !== 'playing' || !isHoldingRef.current || interactionType !== 'hold') return;

    const holdInterval = setInterval(() => {
      setHoldProgress((prev) => {
        const newProgress = prev + (100 / (config.holdDuration! / 100));
        if (newProgress >= 100) {
          endGame(true);
          return 100;
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(holdInterval);
  }, [gameState, interactionType, config.holdDuration, endGame]);

  useEffect(() => {
    if (gameState !== 'playing' || interactionType !== 'rhythm') return;

    const initialHits = new Array(config.targetCount).fill(false);
    setRhythmHits(initialHits);
    rhythmHitsRef.current = initialHits;

    const pattern = config.rhythmPattern!;
    let currentIndex = 0;
    let timeoutId: number;

    const playNextBeat = () => {
      if (currentIndex >= pattern.length) {
        const successCount = rhythmHitsRef.current.filter(Boolean).length;
        const success = successCount >= pattern.length * 0.7;
        endGame(success);
        return;
      }

      setRhythmIndex(currentIndex);
      setRhythmActive(true);

      timeoutId = window.setTimeout(() => {
        setRhythmActive(false);
        currentIndex++;
        playNextBeat();
      }, pattern[currentIndex]);
    };

    timeoutId = window.setTimeout(playNextBeat, 500);

    return () => clearTimeout(timeoutId);
  }, [gameState, interactionType, config.targetCount, config.rhythmPattern, endGame]);

  const startGame = useCallback(() => {
    setGameState('playing');
    setTimeLeft(config.timeLimit);
    setProgress(0);
    setCombo(0);
    setMaxCombo(0);
    setClickCount(0);
    setHoldProgress(0);
    setCurrentSequenceIndex(0);
    setRhythmIndex(0);
    setRhythmHits([]);
    setShowSuccess(false);
    setShowFail(false);
    setStartTime(Date.now());
    setAccuracy(100);
    setIsHolding(false);

    const initialHits = new Array(config.targetCount).fill(false);
    setRhythmHits(initialHits);
    rhythmHitsRef.current = initialHits;

    if (interactionType === 'sequence') {
      const newSequence = Array.from({ length: config.targetCount }, () =>
        SEQUENCE_SYMBOLS[Math.floor(Math.random() * SEQUENCE_SYMBOLS.length)]
      );
      setSequence(newSequence);
    }
  }, [config.timeLimit, config.targetCount, interactionType]);

  const handleClick = useCallback(() => {
    if (gameStateRef.current !== 'playing' || interactionType !== 'click') return;

    setClickCount((prev) => {
      const newCount = prev + 1;
      setProgress((newCount / config.targetCount) * 100);
      setCombo((prevCombo) => {
        const newCombo = prevCombo + 1;
        setMaxCombo((max) => Math.max(max, newCombo));
        return newCombo;
      });

      if (newCount >= config.targetCount) {
        endGame(true);
      }
      return newCount;
    });
  }, [interactionType, config.targetCount, endGame]);

  const handleHoldStart = useCallback(() => {
    if (gameStateRef.current !== 'playing' || interactionType !== 'hold') return;
    setIsHolding(true);
  }, [interactionType]);

  const handleHoldEnd = useCallback(() => {
    if (interactionType !== 'hold') return;
    setIsHolding(false);
    setHoldProgress((prev) => {
      if (prev < 100) {
        setCombo(0);
        return 0;
      }
      return prev;
    });
  }, [interactionType]);

  const handleSequenceClick = useCallback(
    (symbol: string) => {
      if (gameStateRef.current !== 'playing' || interactionType !== 'sequence') return;

      if (symbol === sequence[currentSequenceIndex]) {
        const newIndex = currentSequenceIndex + 1;
        setCurrentSequenceIndex(newIndex);
        setProgress((newIndex / config.targetCount) * 100);
        setCombo((prev) => {
          const newCombo = prev + 1;
          setMaxCombo((max) => Math.max(max, newCombo));
          return newCombo;
        });

        if (newIndex >= config.targetCount) {
          endGame(true);
        }
      } else {
        setCombo(0);
        setAccuracy((prev) => Math.max(0, prev - 10));
      }
    },
    [interactionType, currentSequenceIndex, sequence, config.targetCount, endGame]
  );

  const handleRhythmClick = useCallback(() => {
    if (gameStateRef.current !== 'playing' || interactionType !== 'rhythm') return;

    if (rhythmActive) {
      setRhythmHits((prev) => {
        const newHits = [...prev];
        newHits[rhythmIndex] = true;
        rhythmHitsRef.current = newHits;
        return newHits;
      });
      setCombo((prev) => {
        const newCombo = prev + 1;
        setMaxCombo((max) => Math.max(max, newCombo));
        return newCombo;
      });
      setProgress((prev) => prev + 100 / config.targetCount);
    } else {
      setCombo(0);
      setAccuracy((prev) => Math.max(0, prev - 5));
    }
  }, [interactionType, rhythmActive, rhythmIndex, config.targetCount]);

  const getInteractionIcon = () => {
    switch (interactionType) {
      case 'click':
        return <MousePointer2 className="w-8 h-8" />;
      case 'hold':
        return <Hand className="w-8 h-8" />;
      case 'sequence':
        return <ArrowRight className="w-8 h-8" />;
      case 'rhythm':
        return <Music className="w-8 h-8" />;
    }
  };

  const getInteractionName = () => {
    switch (interactionType) {
      case 'click':
        return '快速连击';
      case 'hold':
        return '长按蓄力';
      case 'sequence':
        return '顺序点击';
      case 'rhythm':
        return '节奏点击';
    }
  };

  const getDifficultyColor = () => {
    switch (task.difficulty) {
      case '简单':
        return 'text-cangshan-green bg-cangshan-green/10';
      case '中等':
        return 'text-gold bg-gold/10';
      case '困难':
        return 'text-embroidery-red bg-embroidery-red/10';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-gradient-to-br from-ivory to-white rounded-3xl shadow-2xl overflow-hidden border-4 border-embroidery-red">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-indigo-batik via-embroidery-red to-gold" />

        <div className="absolute inset-0 bg-batik-pattern opacity-20 pointer-events-none" />

        <div className="relative p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: currentRole?.color || '#1E3A5F' }}
              >
                <span className="text-2xl">{currentRole?.avatar || '👤'}</span>
              </div>
              <div>
                <h3 className="font-baicalligraphy text-xl text-indigo-batik">
                  {task.title}
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', getDifficultyColor())}>
                    {task.difficulty}
                  </span>
                  <span className="text-xs text-gray-500">{getInteractionName()}</span>
                </div>
              </div>
            </div>

            {gameState === 'playing' && (
              <div className="flex items-center space-x-2">
                <Timer className="w-5 h-5 text-embroidery-red" />
                <span className="text-xl font-bold text-embroidery-red font-mono">
                  {timeLeft.toFixed(1)}s
                </span>
              </div>
            )}
          </div>

          <div className="bg-white/60 rounded-2xl p-4 mb-4 border border-gold/20">
            <p className="text-sm text-indigo-batik/80 leading-relaxed">
              {task.description}
            </p>
          </div>

          {task.dialogue && currentRole && (
            <div className="mb-4 flex items-start space-x-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-lg"
                style={{ backgroundColor: currentRole.color }}
              >
                <span>{currentRole.avatar}</span>
              </div>
              <div className="relative flex-1 bg-gradient-to-br from-ivory to-white rounded-2xl rounded-tl-none p-3 border-2 shadow-sm"
                   style={{ borderColor: currentRole.color + '40' }}>
                <div className="absolute -left-1.5 top-2 w-3 h-3 rotate-45"
                     style={{ backgroundColor: '#F5F0E1', borderLeft: `2px solid ${currentRole.color}40`, borderBottom: `2px solid ${currentRole.color}40` }} />
                <p className="text-sm leading-relaxed" style={{ color: currentRole.color }}>
                  <span className="font-bold">{currentRole.honorific}：</span>
                  <span className="text-indigo-batik/80">{task.dialogue}</span>
                </p>
              </div>
            </div>
          )}

          {gameState === 'playing' && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-indigo-batik/60">进度</span>
                  <span className="text-sm font-bold text-indigo-batik">
                    {Math.round(progress)}%
                  </span>
                </div>
                {combo > 1 && (
                  <div className="flex items-center space-x-1 text-embroidery-red">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm font-bold">连击 x{combo}</span>
                  </div>
                )}
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-embroidery-red to-gold transition-all duration-200 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          <div className="min-h-[280px] flex flex-col items-center justify-center">
            {gameState === 'ready' && (
              <div className="text-center animate-fade-in">
                <div
                  className="w-24 h-24 mx-auto mb-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${currentRole?.color || '#1E3A5F'}20` }}
                >
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white"
                    style={{ backgroundColor: currentRole?.color || '#1E3A5F' }}
                  >
                    {getInteractionIcon()}
                  </div>
                </div>
                <h4 className="font-baicalligraphy text-2xl text-indigo-batik mb-2">
                  {getInteractionName()}
                </h4>
                <p className="text-sm text-indigo-batik/60 mb-4">
                  {interactionType === 'click' && (currentRole?.gender === 'female'
                    ? `姐妹们，在 ${config.timeLimit} 秒内一起跳起来，点击 ${config.targetCount} 次！`
                    : currentRole?.id === 'elder'
                    ? `老朽带领大家，在 ${config.timeLimit} 秒内完成 ${config.targetCount} 次叩拜！`
                    : `兄弟们，在 ${config.timeLimit} 秒内挥鞭 ${config.targetCount} 次！`)}
                  {interactionType === 'hold' && (currentRole?.gender === 'female'
                    ? `虔诚地按住 ${config.holdDuration! / 1000} 秒，让心愿上达天听`
                    : currentRole?.id === 'elder'
                    ? `按住 ${config.holdDuration! / 1000} 秒完成祭祀仪轨`
                    : `稳住神坛 ${config.holdDuration! / 1000} 秒，不能松手！`)}
                  {interactionType === 'sequence' && (currentRole?.gender === 'female'
                    ? `按照顺序依次点击 ${config.targetCount} 个吉祥符号`
                    : currentRole?.id === 'elder'
                    ? `按古训依次点击 ${config.targetCount} 个神圣符号`
                    : `按照顺序点击 ${config.targetCount} 个符文，不可错乱！`)}
                  {interactionType === 'rhythm' && (currentRole?.gender === 'female'
                    ? `跟着节拍轻歌曼舞，命中 ${config.targetCount} 次！`
                    : currentRole?.id === 'elder'
                    ? `跟随古老韵律，点击 ${config.targetCount} 次`
                    : `跟着节奏挥鞭，命中 ${config.targetCount} 次！`)}
                </p>

                {skillBonus > 1 && (
                  <div className="bg-gold/10 border border-gold/30 rounded-xl p-3 mb-4">
                    <div className="flex items-center justify-center space-x-2 text-gold">
                      <Sparkles className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {currentRole?.name}技能加成：功德 x{skillBonus}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-center space-x-3">
                  <button
                    onClick={onCancel}
                    className="px-6 py-3 rounded-xl border-2 border-indigo-batik/30 text-indigo-batik font-medium hover:bg-indigo-batik/10 transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={startGame}
                    className="px-8 py-3 bg-gradient-to-r from-embroidery-red to-gold text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center space-x-2"
                  >
                    <Zap className="w-5 h-5" />
                    <span>开始挑战</span>
                  </button>
                </div>
              </div>
            )}

            {gameState === 'playing' && (
              <div className="w-full animate-fade-in">
                {interactionType === 'click' && (
                  <button
                    onClick={handleClick}
                    className="w-48 h-48 mx-auto rounded-full bg-gradient-to-br from-embroidery-red to-gold text-white shadow-2xl hover:scale-105 active:scale-95 transition-all duration-150 flex flex-col items-center justify-center group"
                  >
                    <MousePointer2 className="w-12 h-12 mb-2 group-hover:animate-bounce" />
                    <span className="text-3xl font-bold">{clickCount}</span>
                    <span className="text-sm opacity-80">
                      {currentRole?.gender === 'female' ? '跳起来！' : currentRole?.id === 'elder' ? '叩拜' : '挥鞭'}/{config.targetCount}
                    </span>
                  </button>
                )}

                {interactionType === 'hold' && (
                  <button
                    onMouseDown={handleHoldStart}
                    onMouseUp={handleHoldEnd}
                    onMouseLeave={handleHoldEnd}
                    onTouchStart={handleHoldStart}
                    onTouchEnd={handleHoldEnd}
                    className={cn(
                      'w-48 h-48 mx-auto rounded-full text-white shadow-2xl transition-all duration-150 flex flex-col items-center justify-center relative overflow-hidden',
                      isHolding ? 'scale-105' : 'hover:scale-105 active:scale-95'
                    )}
                    style={{
                      background: isHolding
                        ? 'linear-gradient(135deg, #4A7C23, #2D5016)'
                        : 'linear-gradient(135deg, #C41E3A, #D4AF37)',
                    }}
                  >
                    <svg className="absolute inset-0 w-full h-full -rotate-90">
                      <circle
                        cx="96"
                        cy="96"
                        r="90"
                        fill="none"
                        stroke="rgba(255,255,255,0.3)"
                        strokeWidth="8"
                      />
                      <circle
                        cx="96"
                        cy="96"
                        r="90"
                        fill="none"
                        stroke="white"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${holdProgress * 5.65} 565`}
                        className="transition-all duration-100"
                      />
                    </svg>
                    <Hand className={cn('w-12 h-12 mb-2 transition-transform', isHolding && 'animate-pulse')} />
                    <span className="text-3xl font-bold">{Math.round(holdProgress)}%</span>
                    <span className="text-sm opacity-80">
                      {currentRole?.gender === 'female' ? '虔诚祈祷' : currentRole?.id === 'elder' ? '主持仪轨' : '稳住！'}
                    </span>
                  </button>
                )}

                {interactionType === 'sequence' && (
                  <div className="w-full">
                    <div className="flex justify-center gap-2 mb-6">
                      {sequence.map((symbol, index) => (
                        <div
                          key={index}
                          className={cn(
                            'w-12 h-12 rounded-xl flex items-center justify-center text-2xl border-2 transition-all duration-300',
                            index < currentSequenceIndex
                              ? 'bg-cangshan-green/20 border-cangshan-green'
                              : index === currentSequenceIndex
                              ? 'bg-embroidery-red/20 border-embroidery-red animate-pulse scale-110'
                              : 'bg-gray-100 border-gray-300'
                          )}
                        >
                          {index < currentSequenceIndex ? <Check className="w-6 h-6 text-cangshan-green" /> : symbol}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                      {SEQUENCE_SYMBOLS.map((symbol, index) => (
                        <button
                          key={index}
                          onClick={() => handleSequenceClick(symbol)}
                          className={cn(
                            'w-16 h-16 rounded-xl text-3xl border-2 transition-all duration-150 hover:scale-105 active:scale-95',
                            sequence[currentSequenceIndex] === symbol
                              ? 'bg-white border-gold hover:bg-gold/10 shadow-lg'
                              : 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                          )}
                        >
                          {symbol}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {interactionType === 'rhythm' && (
                  <div className="text-center">
                    <div className="flex justify-center gap-2 mb-8">
                      {config.rhythmPattern!.map((_, index) => (
                        <div
                          key={index}
                          className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200',
                            rhythmHits[index]
                              ? 'bg-cangshan-green text-white'
                              : index === rhythmIndex && rhythmActive
                              ? 'bg-embroidery-red text-white scale-125 animate-pulse'
                              : index < rhythmIndex
                              ? 'bg-gray-300 text-gray-500'
                              : 'bg-gray-100 text-gray-400'
                          )}
                        >
                          {rhythmHits[index] ? <Check className="w-5 h-5" /> : index + 1}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handleRhythmClick}
                      className={cn(
                        'w-40 h-40 rounded-full text-white shadow-2xl transition-all duration-150 flex flex-col items-center justify-center',
                        rhythmActive
                          ? 'bg-gradient-to-br from-gold to-embroidery-red scale-110'
                          : 'bg-gradient-to-br from-indigo-batik to-erhai-blue hover:scale-105 active:scale-95'
                      )}
                    >
                      <Music className={cn('w-12 h-12 mb-2', rhythmActive && 'animate-bounce')} />
                      <span className="text-lg font-bold">
                        {rhythmActive
                          ? (currentRole?.gender === 'female' ? '唱！' : currentRole?.id === 'elder' ? '诵！' : '敲！')
                          : (currentRole?.gender === 'female' ? '等待歌声' : currentRole?.id === 'elder' ? '等待韵律' : '等待节拍')}
                      </span>
                    </button>
                    {combo > 1 && (
                      <div className="mt-4 text-embroidery-red font-bold text-xl animate-bounce">
                        Perfect! x{combo}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {gameState === 'finished' && (
              <div className="text-center animate-fade-in">
                {showSuccess && (
                  <>
                    <div className="relative mb-4">
                      <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-gold to-embroidery-red flex items-center justify-center animate-embroidery">
                        <Trophy className="w-12 h-12 text-white" />
                      </div>
                      <Sparkles className="absolute top-0 right-1/4 w-8 h-8 text-gold animate-pulse" />
                      <Star className="absolute bottom-0 left-1/4 w-6 h-6 text-gold animate-pulse animate-delay-200" />
                    </div>
                    <h4 className="font-baicalligraphy text-3xl text-gold mb-2">
                      {currentRole?.gender === 'female' ? '精彩绝伦！'
                        : currentRole?.id === 'elder' ? '功德圆满！'
                        : '威风凛凛！'}
                    </h4>
                    <p className="text-indigo-batik/60 mb-4">
                      {currentRole?.gender === 'female'
                        ? `${currentRole.honorific}的表现令人赞叹！`
                        : currentRole?.id === 'elder'
                        ? `长老的仪轨一丝不苟！`
                        : `${currentRole.honorific}的气势无人能挡！`}
                      {' '}最高连击：{maxCombo} | 准确率：{accuracy}%
                    </p>
                    <div className="bg-gold/10 border-2 border-gold/30 rounded-2xl p-4 mb-4">
                      <div className="text-sm text-gold mb-1">获得功德</div>
                      <div className="text-4xl font-bold text-gold animate-bounce">
                        +{earnedMerit}
                      </div>
                      {skillBonus > 1 && (
                        <div className="text-xs text-gold/70 mt-1">
                          (含技能加成 x{skillBonus})
                        </div>
                      )}
                    </div>
                  </>
                )}

                {showFail && (
                  <>
                    <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gray-200 flex items-center justify-center">
                      <X className="w-12 h-12 text-gray-400" />
                    </div>
                    <h4 className="font-baicalligraphy text-2xl text-gray-500 mb-2">
                      {currentRole?.gender === 'female' ? '这次没发挥好'
                        : currentRole?.id === 'elder' ? '心诚则灵'
                        : '好汉不怕跌倒'}
                    </h4>
                    <p className="text-indigo-batik/60 mb-4">
                      {currentRole?.gender === 'female'
                        ? '金花姑娘，别灰心，再来一次吧！'
                        : currentRole?.id === 'elder'
                        ? '长老莫急，虔诚再试一次！'
                        : '阿鹏哥，调整状态再战！'}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gold/20 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4 text-gold" />
              <span className="text-sm text-indigo-batik/60">
                功德奖励：{task.meritReward}
                {skillBonus > 1 && (
                  <span className="text-gold"> (x{skillBonus})</span>
                )}
              </span>
            </div>
            <div className="text-xs text-indigo-batik/40">
              {task.interactionType}
            </div>
          </div>
        </div>

        <div className="absolute -top-2 -left-2 w-4 h-4 bg-embroidery-red rounded-full" />
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-embroidery-red rounded-full" />
        <div className="absolute -bottom-2 -left-2 w-4 h-4 bg-embroidery-red rounded-full" />
        <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-embroidery-red rounded-full" />
      </div>
    </div>
  );
}
