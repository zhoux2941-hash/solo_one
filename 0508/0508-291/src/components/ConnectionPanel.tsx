import { useState } from 'react';
import { PeerNetwork } from '../network/PeerNetwork';

interface ConnectionPanelProps {
  peerNetwork: PeerNetwork;
  onJoinGame: (playerName: string) => void;
  isJoined: boolean;
}

export function ConnectionPanel({
  peerNetwork,
  onJoinGame,
  isJoined,
}: ConnectionPanelProps) {
  const [playerName, setPlayerName] = useState('');
  const [offer, setOffer] = useState('');
  const [answer, setAnswer] = useState('');
  const [remoteOffer, setRemoteOffer] = useState('');
  const [remoteAnswer, setRemoteAnswer] = useState('');
  const [myPeerId, setMyPeerId] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleCreateOffer = async () => {
    setIsConnecting(true);
    try {
      const { offer: newOffer, peerId } = await peerNetwork.createOffer();
      setOffer(JSON.stringify(newOffer));
      setMyPeerId(peerId);
    } catch (e) {
      console.error('Failed to create offer:', e);
    }
    setIsConnecting(false);
  };

  const handleAcceptOffer = async () => {
    if (!remoteOffer) return;
    setIsConnecting(true);
    try {
      const offerObj = JSON.parse(remoteOffer);
      const { answer: newAnswer, peerId } = await peerNetwork.acceptOffer(offerObj);
      setAnswer(JSON.stringify(newAnswer));
      setMyPeerId(peerId);
    } catch (e) {
      console.error('Failed to accept offer:', e);
    }
    setIsConnecting(false);
  };

  const handleAcceptAnswer = async () => {
    if (!remoteAnswer || !myPeerId) return;
    setIsConnecting(true);
    try {
      const answerObj = JSON.parse(remoteAnswer);
      await peerNetwork.acceptAnswer(myPeerId, answerObj);
    } catch (e) {
      console.error('Failed to accept answer:', e);
    }
    setIsConnecting(false);
  };

  const handleJoinGame = () => {
    if (playerName.trim()) {
      onJoinGame(playerName.trim());
    }
  };

  const connectedPeers = peerNetwork.getConnectedPeers();

  return (
    <div className="p-4 border-b border-terminal-border space-y-4">
      <h2 className="text-xl text-terminal-prompt">=== P2P 连接 ===</h2>

      {!isJoined ? (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="输入你的角色名..."
              className="flex-1 bg-gray-900 border border-terminal-border text-terminal-text px-3 py-2 rounded"
            />
            <button
              onClick={handleJoinGame}
              disabled={!playerName.trim() || isConnecting}
              className="bg-terminal-border text-terminal-bg px-4 py-2 rounded hover:bg-green-400 disabled:opacity-50"
            >
              开始游戏
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex gap-2">
            <button
              onClick={handleCreateOffer}
              disabled={isConnecting}
              className="flex-1 bg-terminal-info text-white px-3 py-2 rounded hover:bg-cyan-400 disabled:opacity-50 text-sm"
            >
              创建邀请
            </button>
            <button
              onClick={handleAcceptOffer}
              disabled={!remoteOffer || isConnecting}
              className="flex-1 bg-terminal-prompt text-white px-3 py-2 rounded hover:bg-yellow-400 disabled:opacity-50 text-sm"
            >
              接受邀请
            </button>
          </div>

          {offer && (
            <div>
              <label className="text-sm text-terminal-info">你的邀请码 (发送给对方):</label>
              <textarea
                value={offer}
                readOnly
                className="w-full bg-gray-900 border border-terminal-border text-terminal-text px-2 py-1 rounded text-xs h-20 mt-1"
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              />
            </div>
          )}

          <div>
            <label className="text-sm text-terminal-info">粘贴对方的邀请码:</label>
            <textarea
              value={remoteOffer}
              onChange={(e) => setRemoteOffer(e.target.value)}
              placeholder="粘贴邀请码..."
              className="w-full bg-gray-900 border border-terminal-border text-terminal-text px-2 py-1 rounded text-xs h-20 mt-1"
            />
          </div>

          {answer && (
            <div>
              <label className="text-sm text-terminal-info">你的应答码 (发送给对方):</label>
              <textarea
                value={answer}
                readOnly
                className="w-full bg-gray-900 border border-terminal-border text-terminal-text px-2 py-1 rounded text-xs h-20 mt-1"
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              />
            </div>
          )}

          {offer && (
            <div>
              <label className="text-sm text-terminal-info">粘贴对方的应答码:</label>
              <textarea
                value={remoteAnswer}
                onChange={(e) => setRemoteAnswer(e.target.value)}
                placeholder="粘贴应答码..."
                className="w-full bg-gray-900 border border-terminal-border text-terminal-text px-2 py-1 rounded text-xs h-20 mt-1"
              />
              <button
                onClick={handleAcceptAnswer}
                disabled={!remoteAnswer || isConnecting}
                className="w-full mt-2 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-500 disabled:opacity-50 text-sm"
              >
                确认连接
              </button>
            </div>
          )}

          <div className="text-sm">
            <span className="text-terminal-prompt">已连接节点:</span>
            <span className="ml-2 text-terminal-info">{connectedPeers.length}</span>
            {connectedPeers.length > 0 && (
              <div className="mt-1 text-xs text-terminal-text">
                {connectedPeers.map((id) => (
                  <div key={id}>- {id.slice(0, 8)}...</div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
