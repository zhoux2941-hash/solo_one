import { useEffect, useState } from 'react';
import { RotateCcw, RefreshCw, BookOpen, X } from 'lucide-react';
import { usePetStore } from '@/store/usePetStore';
import PixelPet from '@/components/PixelPet';
import StatBar from '@/components/StatBar';
import ActionButton from '@/components/ActionButton';
import TimeInfo from '@/components/TimeInfo';
import MoodDiary from '@/components/MoodDiary';

export default function Home() {
  const { pet, isLoaded, isActionLocked, initializePet, performPetAction, switchPetType, updateWithDecay, resetPet } = usePetStore();
  const [showDiary, setShowDiary] = useState(false);

  useEffect(() => {
    initializePet();
  }, [initializePet]);

  useEffect(() => {
    if (!isLoaded) return;
    
    const interval = setInterval(() => {
      updateWithDecay();
    }, 60000);
    
    return () => clearInterval(interval);
  }, [isLoaded, updateWithDecay]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-bounce text-6xl mb-4">🐾</div>
          <p className="text-gray-600 pixel-text">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
          <div className="w-full lg:w-auto">
            <div className="bg-white rounded-lg border-4 border-gray-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.3)] overflow-hidden">
              <div className="bg-gradient-to-r from-pink-400 to-purple-400 p-4 border-b-4 border-gray-900">
                <div className="flex items-center justify-between">
                  <h1 className="text-lg font-bold text-white pixel-text drop-shadow-md">
                    🎮 像素宠物
                  </h1>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowDiary(!showDiary)}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-sm border-2 border-white/50 transition-all hover:scale-105 active:scale-95 lg:hidden"
                      title="心情日记"
                    >
                      {showDiary ? (
                        <X className="w-4 h-4 text-white" />
                      ) : (
                        <BookOpen className="w-4 h-4 text-white" />
                      )}
                    </button>
                    <button
                      onClick={switchPetType}
                      disabled={isActionLocked}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-sm border-2 border-white/50 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      title="切换宠物"
                    >
                      <RefreshCw className={`w-4 h-4 text-white ${isActionLocked ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={resetPet}
                      disabled={isActionLocked}
                      className="p-2 bg-white/20 hover:bg-white/30 rounded-sm border-2 border-white/50 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      title="重置宠物"
                    >
                      <RotateCcw className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="bg-gradient-to-b from-sky-100 to-sky-200 rounded-sm border-4 border-gray-900 p-6 mb-6">
                  <PixelPet />
                </div>

                <div className="mb-6">
                  <StatBar stat="hunger" value={pet.hunger} icon="🍖" color="bg-orange-400" />
                  <StatBar stat="cleanliness" value={pet.cleanliness} icon="🛁" color="bg-blue-400" />
                  <StatBar stat="happiness" value={pet.happiness} icon="🎾" color="bg-green-400" />
                </div>

                <div className="flex justify-center gap-4 mb-6">
                  <ActionButton
                    action="feed"
                    icon="🍖"
                    onClick={() => performPetAction('feed')}
                    disabled={isActionLocked}
                    color="#F97316"
                  />
                  <ActionButton
                    action="clean"
                    icon="🛁"
                    onClick={() => performPetAction('clean')}
                    disabled={isActionLocked}
                    color="#3B82F6"
                  />
                  <ActionButton
                    action="play"
                    icon="🎾"
                    onClick={() => performPetAction('play')}
                    disabled={isActionLocked}
                    color="#22C55E"
                  />
                </div>

                <TimeInfo
                  lastFed={pet.lastFed}
                  lastCleaned={pet.lastCleaned}
                  lastPlayed={pet.lastPlayed}
                />
              </div>

              <div className="bg-gray-100 p-3 border-t-4 border-gray-900 text-center">
                <p className="text-[10px] text-gray-500 pixel-text">
                  💾 数据自动保存到浏览器
                </p>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 pixel-text">
                宠物类型: {pet.type === 'cat' ? '🐱 猫咪' : '🐶 狗狗'}
              </p>
            </div>
          </div>

          <div className={`w-full lg:w-80 ${showDiary ? 'block animate-slide-in-right' : 'hidden lg:block'}`}>
            <div className="lg:sticky lg:top-4">
              <MoodDiary logs={pet.logs} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
