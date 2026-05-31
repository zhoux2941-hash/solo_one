import { useState, useEffect } from 'react';
import { Reply, Trash2, ChevronDown, ChevronUp, ChevronRight } from 'lucide-react';
import { Message } from '@/store/useTreeholeStore';
import { useTreeholeStore } from '@/store/useTreeholeStore';
import { formatTime } from '@/utils/format';

interface MessageCardProps {
  message: Message;
  index: number;
}

const REPLIES_PER_PAGE = 3;

export default function MessageCard({ message, index }: MessageCardProps) {
  const [showReplies, setShowReplies] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [repliesDisplayCount, setRepliesDisplayCount] = useState(REPLIES_PER_PAGE);

  const { toggleLike, deleteMessage, addReply, likedIds, sessionId } = useTreeholeStore();
  const isLiked = likedIds.includes(message.id);
  const isOwner = message.sessionId === sessionId;

  const handleLike = () => {
    setIsLikeAnimating(true);
    toggleLike(message.id);
    setTimeout(() => setIsLikeAnimating(false), 300);
  };

  const handleDelete = () => {
    if (isOwner && window.confirm('确定要删除这条留言吗？')) {
      deleteMessage(message.id);
    }
  };

  const handleReply = () => {
    if (!replyContent.trim()) return;
    addReply(message.id, replyContent);
    setReplyContent('');
    setShowReplyInput(false);
    setShowReplies(true);
  };

  useEffect(() => {
    if (showReplies) {
      setRepliesDisplayCount(Math.min(REPLIES_PER_PAGE, message.replies.length));
    }
  }, [showReplies, message.replies.length]);

  const handleExpand = () => {
    setRepliesDisplayCount(prev => Math.min(prev + REPLIES_PER_PAGE, message.replies.length));
  };

  const handleCollapse = () => {
    setRepliesDisplayCount(REPLIES_PER_PAGE);
  };

  const displayedReplies = message.replies.slice(0, repliesDisplayCount);
  const hasMore = repliesDisplayCount < message.replies.length;
  const remainingCount = message.replies.length - repliesDisplayCount;

  return (
    <div
      className="glass-card message-card rounded-2xl p-5 animate-slide-up"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r from-treehole-accent/20 to-treehole-accent-light/20 text-treehole-accent text-sm font-medium border border-treehole-accent/30">
              {message.nickname}
            </span>
            <span className="text-xs text-treehole-text-muted">
              {formatTime(message.createdAt)}
            </span>
            {isOwner && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-treehole-card-light/50 text-treehole-text-muted text-xs">
                我发布的
              </span>
            )}
          </div>
          <p className="text-treehole-text leading-relaxed whitespace-pre-wrap break-words text-sm">
            {message.content}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-treehole-border/50">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLike}
            className={`like-btn flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all duration-200 ${
              isLiked
                ? 'bg-treehole-accent/20 text-treehole-accent'
                : 'bg-treehole-card-light/30 text-treehole-text-muted hover:text-treehole-accent hover:bg-treehole-accent/10'
            } ${isLikeAnimating ? 'animate-pop' : ''}`}
          >
            <span className="text-lg">👍</span>
            <span className="text-sm font-medium">{message.likes}</span>
          </button>

          <button
            onClick={() => setShowReplyInput(!showReplyInput)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-treehole-card-light/30 text-treehole-text-muted hover:text-treehole-accent-light hover:bg-treehole-accent-light/10 transition-all duration-200"
          >
            <Reply size={16} />
            <span className="text-sm">回复</span>
          </button>

          {message.replies.length > 0 && (
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1 text-sm text-treehole-text-muted hover:text-treehole-text transition-colors"
            >
              <span>{message.replies.length} 条回复</span>
              {showReplies ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          )}
        </div>

        {isOwner && (
          <button
            onClick={handleDelete}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all duration-200"
          >
            <Trash2 size={14} />
            <span className="text-sm">删</span>
          </button>
        )}
      </div>

      {showReplyInput && (
        <div className="mt-3 p-3 bg-treehole-card/30 rounded-xl animate-fade-in">
          <div className="flex gap-2">
            <input
              type="text"
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleReply()}
              placeholder="写下你的回复..."
              maxLength={100}
              className="flex-1 bg-treehole-bg/50 border border-treehole-border rounded-lg px-3 py-2 text-sm text-treehole-text placeholder-treehole-text-muted/60 focus:border-treehole-accent/50 transition-all"
              autoFocus
            />
            <button
              onClick={handleReply}
              disabled={!replyContent.trim()}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                replyContent.trim()
                  ? 'bg-treehole-accent text-white hover:bg-treehole-accent-light'
                  : 'bg-treehole-card text-treehole-text-muted cursor-not-allowed'
              }`}
            >
              发送
            </button>
          </div>
        </div>
      )}

      {showReplies && message.replies.length > 0 && (
        <div className="mt-3 space-y-2 animate-fade-in">
          {displayedReplies.map((reply, replyIndex) => (
            <div
              key={reply.id}
              className="p-3 bg-treehole-card/40 rounded-xl border-l-2 border-treehole-accent/50 animate-fade-in"
              style={{ animationDelay: `${replyIndex * 0.05}s` }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-medium text-treehole-accent">
                  {reply.nickname}
                </span>
                <span className="text-xs text-treehole-text-muted">
                  {formatTime(reply.createdAt)}
                </span>
              </div>
              <p className="text-sm text-treehole-text/90 break-words">
                {reply.content}
              </p>
            </div>
          ))}

          <div className="flex items-center gap-3 pt-1">
            {hasMore && (
              <button
                onClick={handleExpand}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-treehole-accent/10 text-treehole-accent hover:bg-treehole-accent/20 transition-all duration-200 text-sm font-medium"
              >
                <ChevronRight size={14} className="animate-pulse" />
                <span>展开 {remainingCount} 条回复</span>
              </button>
            )}
            {!hasMore && repliesDisplayCount > REPLIES_PER_PAGE && (
              <button
                onClick={handleCollapse}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-treehole-card-light/30 text-treehole-text-muted hover:bg-treehole-card-light/50 hover:text-treehole-text transition-all duration-200 text-sm"
              >
                <ChevronUp size={14} />
                <span>收起回复</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
