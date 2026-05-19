import { useState, useEffect, useRef } from 'react';
import { PeerNetwork } from './network/PeerNetwork';
import { GameEngine } from './game/GameEngine';
import { GameState, Message } from './types';
import { StoryState } from './ai/types';
import { TerminalOutput } from './components/TerminalOutput';
import { CommandInput } from './components/CommandInput';
import { PlayerStatus } from './components/PlayerStatus';
import { ConnectionPanel } from './components/ConnectionPanel';
import { StoryPanel } from './components/StoryPanel';

function App() {
  const peerNetworkRef = useRef<PeerNetwork | null>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [storyState, setStoryState] = useState<StoryState | null>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [nodeId, setNodeId] = useState('');
  const [isAIReady, setIsAIReady] = useState(false);

  useEffect(() => {
    peerNetworkRef.current = new PeerNetwork();
    setNodeId(peerNetworkRef.current.nodeId);

    gameEngineRef.current = new GameEngine(peerNetworkRef.current);
    gameEngineRef.current.setOnMessage((msg) => {
      setMessages((prev) => [...prev, msg]);
    });
    gameEngineRef.current.setOnStateChange((state) => {
      setGameState(state);
    });
    gameEngineRef.current.setOnStoryUpdate((state) => {
      setStoryState(state);
    });

    const initialState = gameEngineRef.current.getState();
    setGameState(initialState);

    gameEngineRef.current.initializeAI().then(() => {
      setIsAIReady(true);
    });

    return () => {
      gameEngineRef.current?.destroy();
    };
  }, []);

  const handleJoinGame = (playerName: string) => {
    gameEngineRef.current?.joinGame(playerName);
    setIsJoined(true);
  };

  const handleCommand = async (command: string) => {
    if (!gameEngineRef.current) return;
    await gameEngineRef.current.processCommand(command);
  };

  const handleRegenerateStory = () => {
    gameEngineRef.current?.regenerateStory();
  };

  return (
    <div className="min-h-screen bg-terminal-bg font-mono">
      <div className="container mx-auto p-4 max-w-6xl">
        <header className="text-center mb-6">
          <h1 className="text-3xl text-terminal-prompt mb-2">
            ⚔️ 去中心化 MUD 游戏引擎 ⚔️
          </h1>
          <p className="text-terminal-text text-sm">
            基于 WebRTC + CRDT + DHT 的 P2P 多人地牢探险
          </p>
        </header>

        <div className="flex flex-col lg:flex-row gap-4">
          <div className="lg:w-1/3">
            <PlayerStatus state={gameState} nodeId={nodeId} />
            {peerNetworkRef.current && (
              <ConnectionPanel
                peerNetwork={peerNetworkRef.current}
                onJoinGame={handleJoinGame}
                isJoined={isJoined}
              />
            )}
            <StoryPanel
              storyState={storyState}
              onRegenerateStory={handleRegenerateStory}
              isReady={isAIReady}
            />
            <div className="p-4 border border-terminal-border">
              <h2 className="text-lg text-terminal-prompt mb-2">=== 快捷命令 ===</h2>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <button
                  onClick={() => handleCommand('look')}
                  disabled={!isJoined}
                  className="bg-gray-800 text-terminal-text px-2 py-1 rounded hover:bg-gray-700 disabled:opacity-50"
                >
                  look
                </button>
                <button
                  onClick={() => handleCommand('inventory')}
                  disabled={!isJoined}
                  className="bg-gray-800 text-terminal-text px-2 py-1 rounded hover:bg-gray-700 disabled:opacity-50"
                >
                  inventory
                </button>
                <button
                  onClick={() => handleCommand('players')}
                  disabled={!isJoined}
                  className="bg-gray-800 text-terminal-text px-2 py-1 rounded hover:bg-gray-700 disabled:opacity-50"
                >
                  players
                </button>
                <button
                  onClick={() => handleCommand('help')}
                  disabled={!isJoined}
                  className="bg-gray-800 text-terminal-text px-2 py-1 rounded hover:bg-gray-700 disabled:opacity-50"
                >
                  help
                </button>
              </div>
              <div className="mt-3">
                <h3 className="text-terminal-info mb-1">移动:</h3>
                <div className="grid grid-cols-3 gap-1">
                  <div></div>
                  <button
                    onClick={() => handleCommand('north')}
                    disabled={!isJoined}
                    className="bg-gray-800 text-terminal-text px-2 py-1 rounded hover:bg-gray-700 disabled:opacity-50 text-xs"
                  >
                    N
                  </button>
                  <div></div>
                  <button
                    onClick={() => handleCommand('west')}
                    disabled={!isJoined}
                    className="bg-gray-800 text-terminal-text px-2 py-1 rounded hover:bg-gray-700 disabled:opacity-50 text-xs"
                  >
                    W
                  </button>
                  <div className="text-center text-terminal-text text-xs">●</div>
                  <button
                    onClick={() => handleCommand('east')}
                    disabled={!isJoined}
                    className="bg-gray-800 text-terminal-text px-2 py-1 rounded hover:bg-gray-700 disabled:opacity-50 text-xs"
                  >
                    E
                  </button>
                  <div></div>
                  <button
                    onClick={() => handleCommand('south')}
                    disabled={!isJoined}
                    className="bg-gray-800 text-terminal-text px-2 py-1 rounded hover:bg-gray-700 disabled:opacity-50 text-xs"
                  >
                    S
                  </button>
                  <div></div>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-2/3 flex flex-col border border-terminal-border rounded bg-black/50 h-[70vh]">
            <div className="p-3 border-b border-terminal-border">
              <span className="text-terminal-prompt">~$</span>
              <span className="text-terminal-text ml-2">mud-terminal</span>
            </div>
            <TerminalOutput messages={messages} />
            <CommandInput onCommand={handleCommand} disabled={!isJoined} />
          </div>
        </div>

        <footer className="mt-6 text-center text-sm text-terminal-text/50">
          <p>去中心化 MUD 游戏引擎 | 房间最大玩家数: 8 | 节点ID: {nodeId.slice(0, 8)}...</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
