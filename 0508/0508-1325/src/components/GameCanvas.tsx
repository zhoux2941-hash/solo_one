import { useEffect, useRef, useCallback } from 'react';
import { useGameStore, completeThrow } from '@/store/gameStore';
import { GAME_CONFIG, DISTANCE_ZONES } from '@/config/gameConfig';
import { getDistanceZone, getScoreByZone, checkCollision, calculateParabolicPath } from '@/utils/gameUtils';
import { playDingSound, playThrowSound, playMissSound } from '@/utils/audioUtils';
import { DistanceZone } from '@/types/game';
import { Basket } from './Basket';
import { EmbroideredBall } from './EmbroideredBall';
import { DistanceMarkers } from './DistanceMarkers';
import { CloudBackground } from './GameDecorations';
import { ScorePopup } from './ScorePopup';

interface BallAnimationData {
  startTime: number;
  startY: number;
  targetY: number;
  targetX: number;
  duration: number;
}

export function GameCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const basketDirectionRef = useRef<1 | -1>(1);
  const ballAnimationRef = useRef<BallAnimationData | null>(null);
  
  const {
    status,
    basketPosition,
    basketYPosition,
    ballPosition,
    isBallFlying,
    scorePopup,
    updateBasketPosition,
    updateBallPosition,
    setScorePopup,
  } = useGameStore();

  const getFlyDuration = (yPercent: number): number => {
    const zone = getDistanceZone(yPercent);
    switch (zone) {
      case 'far': return GAME_CONFIG.ballFlyDuration.far;
      case 'middle': return GAME_CONFIG.ballFlyDuration.middle;
      case 'near': return GAME_CONFIG.ballFlyDuration.near;
      default: return GAME_CONFIG.ballFlyDuration.middle;
    }
  };

  const getCurrentZone = (): DistanceZone | null => {
    return getDistanceZone(basketYPosition);
  };

  const animateBasket = useCallback(() => {
    if (status === 'idle' || status === 'finished') {
      animationRef.current = requestAnimationFrame(animateBasket);
      return;
    }

    const currentPos = useGameStore.getState().basketPosition;
    let newPos = currentPos + GAME_CONFIG.basketSpeed * basketDirectionRef.current;
    
    if (newPos >= 88) {
      newPos = 88;
      basketDirectionRef.current = -1;
    } else if (newPos <= 12) {
      newPos = 12;
      basketDirectionRef.current = 1;
    }
    
    updateBasketPosition(newPos);
    animationRef.current = requestAnimationFrame(animateBasket);
  }, [status, updateBasketPosition]);

  const animateBall = useCallback((timestamp: number) => {
    if (!ballAnimationRef.current) return;

    const { startTime, startY, targetY, targetX, duration } = ballAnimationRef.current;
    const elapsed = timestamp - startTime;
    const progress = Math.min(elapsed / duration, 1);

    const pos = calculateParabolicPath(progress, startY, targetY, targetX);
    updateBallPosition(pos);

    if (progress >= 1) {
      const canvasWidth = canvasRef.current?.clientWidth || GAME_CONFIG.canvasWidth;
      const collision = checkCollision(
        { x: (pos.x / 100) * canvasWidth, y: pos.y },
        useGameStore.getState().basketPosition,
        GAME_CONFIG.basketWidth,
        canvasWidth,
        GAME_CONFIG.ballSize
      );

      const zone = getDistanceZone(pos.y);
      const score = collision ? getScoreByZone(zone) : 0;

      if (collision && score > 0) {
        playDingSound();
      } else {
        playMissSound();
      }

      completeThrow({
        success: collision && score > 0,
        zone: collision ? zone : null,
        score,
      }, pos);

      ballAnimationRef.current = null;
      
      setTimeout(() => {
        setScorePopup(null);
      }, 1000);
      
      return;
    }

    requestAnimationFrame(animateBall);
  }, [updateBallPosition, setScorePopup]);

  useEffect(() => {
    if (isBallFlying && !ballAnimationRef.current) {
      const state = useGameStore.getState();
      if (state.status !== 'throwing') {
        return;
      }
      
      playThrowSound();
      
      const targetY = state.basketYPosition;
      const duration = getFlyDuration(targetY);
      
      const accuracyOffset = (Math.random() - 0.5) * 20;
      const targetX = state.basketPosition + accuracyOffset;
      
      ballAnimationRef.current = {
        startTime: performance.now(),
        startY: GAME_CONFIG.startBallY,
        targetY,
        targetX: Math.max(10, Math.min(90, targetX)),
        duration,
      };
      requestAnimationFrame(animateBall);
    }
  }, [isBallFlying, animateBall]);

  useEffect(() => {
    animationRef.current = requestAnimationFrame(animateBasket);
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animateBasket]);

  useEffect(() => {
    if (status === 'idle' || status === 'finished') {
      ballAnimationRef.current = null;
    }
  }, [status]);

  const currentZone = getCurrentZone();
  const zoneConfig = DISTANCE_ZONES.find(z => z.zone === currentZone);

  return (
    <div
      ref={canvasRef}
      className="relative w-full max-w-4xl mx-auto aspect-[4/3] bg-gradient-to-b from-sky-400 via-sky-300 to-emerald-200 rounded-2xl overflow-hidden shadow-2xl game-border"
    >
      <CloudBackground />
      
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-green-600 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-green-700 to-green-600" />
      
      <div className="absolute bottom-10 left-10 text-6xl opacity-60">🌳</div>
      <div className="absolute bottom-8 right-16 text-5xl opacity-50">🌲</div>
      <div className="absolute bottom-12 left-1/4 text-4xl opacity-40">🌿</div>
      <div className="absolute bottom-14 right-1/3 text-5xl opacity-50">🌳</div>
      
      <DistanceMarkers />
      
      {status === 'playing' && zoneConfig && (
        <div 
          className="absolute top-4 right-4 px-4 py-2 rounded-full text-white font-bold text-sm shadow-lg animate-pulse"
          style={{ backgroundColor: zoneConfig.color }}
        >
          当前: {zoneConfig.label}
        </div>
      )}
      
      <Basket positionPercent={basketPosition} yPercent={basketYPosition} />
      
      {ballPosition && (
        <EmbroideredBall position={ballPosition} isFlying={isBallFlying} />
      )}
      
      {!isBallFlying && status === 'playing' && (
        <EmbroideredBall
          position={{ x: 50, y: GAME_CONFIG.startBallY }}
          isFlying={false}
        />
      )}
      
      {scorePopup && (
        <ScorePopup score={scorePopup.score} position={scorePopup.position} />
      )}
      
      {status === 'idle' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-8xl mb-4 animate-float">🎯</div>
            <h2 className="text-4xl font-display text-white mb-2 drop-shadow-lg">
              壮族抛绣球
            </h2>
            <p className="text-zhuang-cream text-lg mb-4 drop-shadow">
              点击"开始游戏"，瞄准移动的背篓抛球得分！
            </p>
            <div className="flex gap-4 justify-center text-sm">
              <span className="px-3 py-1 bg-zhuang-green/80 rounded-full text-white">
                近区 +5
              </span>
              <span className="px-3 py-1 bg-zhuang-blue/80 rounded-full text-white">
                中区 +10
              </span>
              <span className="px-3 py-1 bg-zhuang-red/80 rounded-full text-white">
                远区 +20
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
