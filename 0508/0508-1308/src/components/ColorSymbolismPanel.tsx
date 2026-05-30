import { useStore } from '../store/useStore';
import { Info } from 'lucide-react';

const ColorSymbolismPanel = () => {
  const { colorSymbolism, activeTab, setActiveTab } = useStore();

  return (
    <div className="bg-paper rounded-xl border-2 border-gold/30 overflow-hidden">
      <div className="flex border-b-2 border-gold/30">
        <button
          onClick={() => setActiveTab('info')}
          className={`
            flex-1 px-6 py-4 font-display text-lg transition-all duration-200
            ${activeTab === 'info' 
              ? 'bg-gold/10 text-primary border-b-2 border-primary' 
              : 'text-ink-light hover:text-ink hover:bg-gold/5'}
          `}
        >
          脸谱信息
        </button>
        <button
          onClick={() => setActiveTab('color-symbolism')}
          className={`
            flex-1 px-6 py-4 font-display text-lg transition-all duration-200
            ${activeTab === 'color-symbolism' 
              ? 'bg-gold/10 text-primary border-b-2 border-primary' 
              : 'text-ink-light hover:text-ink hover:bg-gold/5'}
          `}
        >
          颜色象征
        </button>
      </div>

      <div className="p-6">
        {activeTab === 'color-symbolism' ? (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Info className="w-5 h-5 text-primary" />
              <h3 className="text-xl font-display text-ink">川剧脸谱颜色象征意义</h3>
            </div>
            <p className="text-sm text-ink-light mb-6">
              川剧脸谱的颜色具有严格的象征意义，不同颜色代表不同的人物性格和品质，
              是观众理解角色的重要视觉线索。
            </p>
            
            <div className="grid grid-cols-3 gap-4">
              {colorSymbolism.map((item, index) => (
                <div
                  key={item.id}
                  className="group p-4 rounded-xl border-2 border-gold/20 
                             hover:border-gold hover:shadow-lg transition-all duration-300
                             hover:-translate-y-1 animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s`, opacity: 0 }}
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-12 h-12 rounded-lg border-2 border-ink/20 shadow-md
                                 group-hover:scale-110 transition-transform duration-300"
                      style={{ backgroundColor: item.hex }}
                    />
                    <div className="flex-1">
                      <h4 className="font-display text-lg text-ink mb-1">
                        {item.color}
                      </h4>
                      <p className="text-xs text-ink-light mb-1">
                        {item.hex}
                      </p>
                      <p className="text-sm text-ink leading-relaxed">
                        {item.meaning}
                      </p>
                      <p className="text-xs text-ink-light mt-2 pt-2 border-t border-gold/10">
                        <span className="font-medium text-ink">代表人物：</span>
                        {item.examples}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-gold/5 rounded-lg border border-gold/20">
              <h4 className="font-display text-ink mb-2">💡 文化小贴士</h4>
              <p className="text-sm text-ink-light leading-relaxed">
                川剧脸谱的颜色运用源自中国传统的美学观念和哲学思想。
                红色代表忠义，来自关羽的传说；白色代表奸诈，是曹操的典型形象；
                黑色代表刚直，源于包公的故事。这些颜色象征已经深入中国文化，
                成为人们认知和评判人物的视觉符号。
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-ink-light">
            <p>选择「颜色象征」标签页查看川剧脸谱颜色的文化含义</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ColorSymbolismPanel;
