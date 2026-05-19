import { useState, useEffect } from 'react';
import { StoryState, Clue } from '../ai/types';

interface StoryPanelProps {
  storyState: StoryState | null;
  onRegenerateStory: () => void;
  isReady: boolean;
}

export function StoryPanel({ storyState, onRegenerateStory, isReady }: StoryPanelProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'clues' | 'events'>('summary');

  if (!storyState) {
    return (
      <div className="border border-terminal-border p-4">
        <h3 className="text-terminal-prompt mb-2">📜 剧情系统</h3>
        <p className="text-terminal-text">正在初始化...</p>
      </div>
    );
  }

  const discoveredClues = storyState.clues.filter((c) => c.isDiscovered);
  const revealedEvents = Array.from(storyState.generatedContent.values())
    .filter((c) => c.isRevealed && c.type !== 'room_description')
    .sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="border border-terminal-border">
      <div className="flex border-b border-terminal-border">
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 py-2 px-3 text-sm ${
            activeTab === 'summary'
              ? 'bg-terminal-border text-black'
              : 'text-terminal-text hover:bg-gray-800'
          }`}
        >
          📊 进度
        </button>
        <button
          onClick={() => setActiveTab('clues')}
          className={`flex-1 py-2 px-3 text-sm ${
            activeTab === 'clues'
              ? 'bg-terminal-border text-black'
              : 'text-terminal-text hover:bg-gray-800'
          }`}
        >
          🔍 线索 ({discoveredClues.length}/5)
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`flex-1 py-2 px-3 text-sm ${
            activeTab === 'events'
              ? 'bg-terminal-border text-black'
              : 'text-terminal-text hover:bg-gray-800'
          }`}
        >
          ✨ 事件
        </button>
      </div>

      <div className="p-4 max-h-64 overflow-y-auto">
        {activeTab === 'summary' && (
          <div className="text-sm space-y-2">
            <div className="flex justify-between text-terminal-text">
              <span>种子:</span>
              <span className="text-terminal-info font-mono">{storyState.uniqueSeed}</span>
            </div>
            <div className="flex justify-between text-terminal-text">
              <span>剧情进度:</span>
              <span className="text-terminal-info">{storyState.plotProgression}%</span>
            </div>
            <div className="w-full bg-gray-800 rounded h-2 mt-1">
              <div
                className="bg-terminal-info h-2 rounded transition-all"
                style={{ width: `${Math.min(storyState.plotProgression, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-terminal-text">
              <span>探索房间:</span>
              <span>{storyState.context.visitedRooms.length}/5</span>
            </div>
            <div className="flex justify-between text-terminal-text">
              <span>击败怪物:</span>
              <span>{storyState.context.defeatedMonsters.length}/4</span>
            </div>
            <div className="flex justify-between text-terminal-text">
              <span>发现线索:</span>
              <span>{discoveredClues.length}/5</span>
            </div>
            
            <div className="mt-4 pt-4 border-t border-terminal-border">
              <button
                onClick={onRegenerateStory}
                disabled={!isReady}
                className="w-full bg-terminal-prompt text-black py-2 rounded hover:bg-yellow-400 disabled:opacity-50 text-sm"
              >
                🔄 重新生成剧情 (新种子)
              </button>
              <p className="text-terminal-text text-xs mt-2 opacity-70 text-center">
                {isReady ? 'AI生成器已就绪' : '正在加载生成器...'}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'clues' && (
          <div className="space-y-3">
            {discoveredClues.length === 0 ? (
              <p className="text-terminal-text text-sm opacity-70 text-center py-4">
                尚未发现任何线索...
                <br />
                <span className="text-xs">探索房间以发现隐藏的秘密</span>
              </p>
            ) : (
              discoveredClues.map((clue: Clue) => (
                <div
                  key={clue.id}
                  className={`p-3 rounded border ${
                    clue.importance === 'high'
                      ? 'border-terminal-prompt bg-yellow-900/20'
                      : clue.importance === 'medium'
                      ? 'border-terminal-info bg-cyan-900/20'
                      : 'border-gray-600 bg-gray-800/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-terminal-prompt text-xs">
                      {clue.importance === 'high' ? '⭐ 重要' : 
                       clue.importance === 'medium' ? '📌 中等' : '📎 普通'}
                    </span>
                    <span className="text-terminal-text text-xs opacity-70">
                      {clue.roomId}
                    </span>
                  </div>
                  <p className="text-terminal-text text-sm">{clue.content}</p>
                  {clue.leadsTo && clue.leadsTo !== 'FINAL' && (
                    <p className="text-terminal-info text-xs mt-1 opacity-70">
                      → 指向: {clue.leadsTo}
                    </p>
                  )}
                </div>
              ))
            )}
            
            {storyState.clues.filter((c) => !c.isDiscovered).length > 0 && (
              <div className="mt-4 pt-3 border-t border-terminal-border">
                <p className="text-terminal-text text-xs opacity-50 mb-2">
                  未发现的线索:
                </p>
                {storyState.clues
                  .filter((c) => !c.isDiscovered)
                  .map((clue) => (
                    <div key={clue.id} className="text-xs text-terminal-text opacity-40">
                      ❓ 在{clue.roomId}房间某处...
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-3">
            {revealedEvents.length === 0 ? (
              <p className="text-terminal-text text-sm opacity-70 text-center py-4">
                还没有触发特殊事件
              </p>
            ) : (
              revealedEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3 rounded border border-terminal-border bg-gray-800/50"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-terminal-info text-xs">
                      {event.type === 'clue' ? '🔍 线索' : 
                       event.type === 'event' ? '✨ 事件' : '📝 记录'}
                    </span>
                  </div>
                  <p className="text-terminal-text text-sm whitespace-pre-wrap">{event.content}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
