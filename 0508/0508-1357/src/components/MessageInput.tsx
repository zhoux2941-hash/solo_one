import { useState } from 'react';
import { Send } from 'lucide-react';
import { useTreeholeStore } from '@/store/useTreeholeStore';

export default function MessageInput() {
  const [content, setContent] = useState('');
  const addMessage = useTreeholeStore((state) => state.addMessage);
  const maxLength = 200;

  const handleSubmit = () => {
    if (!content.trim() || content.length > maxLength) return;
    addMessage(content);
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const remaining = maxLength - content.length;
  const isOverLimit = remaining < 0;
  const isEmpty = !content.trim();

  return (
    <div className="glass-card gradient-border rounded-2xl p-5 mb-6 animate-slide-up">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-2xl">🌳</span>
        <h3 className="text-treehole-accent font-display text-lg">说点什么吧...</h3>
      </div>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="在这里匿名倾诉你的心声，没人知道你是谁..."
        maxLength={maxLength + 50}
        className="w-full h-28 bg-treehole-card/50 border border-treehole-border rounded-xl p-4 text-treehole-text placeholder-treehole-text-muted/60 resize-none transition-all duration-200 text-sm leading-relaxed"
      />
      <div className="flex items-center justify-between mt-3">
        <div className={`text-xs ${isOverLimit ? 'text-red-400' : 'text-treehole-text-muted'}`}>
          {remaining} / {maxLength} 字
          {isOverLimit && <span className="ml-2">超出字数限制！</span>}
        </div>
        <button
          onClick={handleSubmit}
          disabled={isEmpty || isOverLimit}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-medium text-sm transition-all duration-300 btn-glow ${
            isEmpty || isOverLimit
              ? 'bg-treehole-card text-treehole-text-muted cursor-not-allowed'
              : 'bg-gradient-to-r from-treehole-accent to-treehole-accent-light text-white hover:from-treehole-accent-light hover:to-treehole-accent'
          }`}
        >
          <Send size={16} />
          <span>发布留言</span>
        </button>
      </div>
      <div className="mt-2 text-xs text-treehole-text-muted/60">
        💡 提示：Ctrl/Cmd + Enter 快速发布
      </div>
    </div>
  );
}
