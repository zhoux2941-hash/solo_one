import MessageInput from '@/components/MessageInput';
import MessageCard from '@/components/MessageCard';
import ParticleBackground from '@/components/ParticleBackground';
import { useTreeholeStore } from '@/store/useTreeholeStore';

export default function Home() {
  const messages = useTreeholeStore((state) => state.messages);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <ParticleBackground />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-8 sm:px-6">
        <header className="text-center mb-8 animate-slide-up">
          <div className="inline-flex items-center justify-center mb-4">
            <span className="text-5xl animate-float">🌳</span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl mb-2 bg-gradient-to-r from-treehole-accent via-treehole-accent-light to-treehole-accent bg-clip-text text-transparent">
            校园树洞
          </h1>
          <p className="text-treehole-text-muted text-sm sm:text-base mt-2">
            匿名倾诉，温暖相伴 · 你的秘密在这里安全
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-treehole-text-muted/70">
            <span>🔒 无需登录</span>
            <span>·</span>
            <span>📝 最多30条留言</span>
            <span>·</span>
            <span>💬 自由表达</span>
          </div>
        </header>

        <MessageInput />

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg text-treehole-text">
            留言墙
            <span className="ml-2 text-sm text-treehole-text-muted">
              ({messages.length}/30)
            </span>
          </h2>
        </div>

        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="glass-card rounded-2xl p-10 text-center animate-fade-in">
              <div className="text-5xl mb-4">🌙</div>
              <p className="text-treehole-text-muted">
                还没有人留言，成为第一个倾诉者吧！
              </p>
              <p className="text-treehole-text-muted/60 text-sm mt-2">
                在这里，你可以放下所有顾虑
              </p>
            </div>
          ) : (
              messages.map((message, index) => (
                <MessageCard key={message.id} message={message} index={index} />
              ))
            )}
        </div>

        <footer className="mt-12 text-center text-xs text-treehole-text-muted/50">
          <p>💡 关闭浏览器后数据将保存在本地，请珍惜每一次真诚的分享</p>
          <p className="mt-1">仅同一会话内可删除自己发布的留言</p>
        </footer>
      </div>
    </div>
  );
}
