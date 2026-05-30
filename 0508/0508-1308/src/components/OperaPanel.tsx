import { useState } from 'react';
import { useStore } from '../store/useStore';
import { BookOpen, ChevronDown, ChevronRight, Theater, Scroll, Star } from 'lucide-react';

const OperaPanel = () => {
  const { facePattern, activeTab, setActiveTab } = useStore();
  const [expandedOperaId, setExpandedOperaId] = useState<number | null>(null);

  if (!facePattern) {
    return null;
  }

  const selectedCharacter = useStore.getState().characters.find(
    (c) => c.id === facePattern.characterId
  );

  const toggleOpera = (operaId: number) => {
    setExpandedOperaId(expandedOperaId === operaId ? null : operaId);
  };

  const operas = facePattern.relatedOperas || [];

  return (
    <div className="bg-paper rounded-xl border-2 border-gold/30 mt-6 overflow-hidden">
      <div className="flex border-b-2 border-gold/30">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 px-4 py-3 font-display text-lg transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === 'info'
              ? 'bg-primary text-white'
              : 'text-ink hover:bg-gold/10'
          }`}
        >
          <Scroll className="w-5 h-5" />
          图案信息
        </button>
        <button
          onClick={() => setActiveTab('operas')}
          className={`flex-1 px-4 py-3 font-display text-lg transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === 'operas'
              ? 'bg-primary text-white'
              : 'text-ink hover:bg-gold/10'
          }`}
        >
          <Theater className="w-5 h-5" />
          经典剧目
          {operas.length > 0 && (
            <span className="bg-gold text-ink text-xs px-2 py-0.5 rounded-full">
              {operas.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('color-symbolism')}
          className={`flex-1 px-4 py-3 font-display text-lg transition-all duration-200 flex items-center justify-center gap-2 ${
            activeTab === 'color-symbolism'
              ? 'bg-primary text-white'
              : 'text-ink hover:bg-gold/10'
          }`}
        >
          <Star className="w-5 h-5" />
          颜色象征
        </button>
      </div>

      {activeTab === 'operas' && (
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-display text-ink">
              {selectedCharacter?.name} 相关川剧剧目
            </h3>
          </div>

          {operas.length === 0 ? (
            <div className="text-center py-8 text-ink-light">
              <Theater className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>暂无相关剧目信息</p>
            </div>
          ) : (
            <div className="space-y-3">
              {operas.map((opera) => (
                <div
                  key={opera.id}
                  className="border border-gold/30 rounded-lg overflow-hidden bg-paper-light hover:border-gold transition-colors duration-200"
                >
                  <button
                    onClick={() => toggleOpera(opera.id)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Theater className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-display text-lg text-ink">
                          {opera.name}
                          {opera.alias && (
                            <span className="text-sm text-ink-light ml-2">
                              「{opera.alias}」
                            </span>
                          )}
                        </h4>
                        <p className="text-xs text-ink-light line-clamp-1">
                          {opera.description}
                        </p>
                      </div>
                    </div>
                    {expandedOperaId === opera.id ? (
                      <ChevronDown className="w-5 h-5 text-primary flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-ink-light flex-shrink-0" />
                    )}
                  </button>

                  {expandedOperaId === opera.id && (
                    <div className="px-4 pb-4 border-t border-gold/20">
                      <div className="mt-4 space-y-4">
                        <div>
                          <h5 className="text-sm font-medium text-primary mb-1 flex items-center gap-1">
                            <Scroll className="w-4 h-4" />
                            剧情简介
                          </h5>
                          <p className="text-sm text-ink leading-relaxed bg-white/50 rounded-lg p-3">
                            {opera.plotSummary}
                          </p>
                        </div>

                        {opera.historicalBackground && (
                          <div>
                            <h5 className="text-sm font-medium text-stone mb-1 flex items-center gap-1">
                              <BookOpen className="w-4 h-4" />
                              历史背景
                            </h5>
                            <p className="text-sm text-ink leading-relaxed bg-white/50 rounded-lg p-3">
                              {opera.historicalBackground}
                            </p>
                          </div>
                        )}

                        {opera.culturalSignificance && (
                          <div>
                            <h5 className="text-sm font-medium text-gold-dark mb-1 flex items-center gap-1">
                              <Star className="w-4 h-4" />
                              文化意义
                            </h5>
                            <p className="text-sm text-ink leading-relaxed bg-white/50 rounded-lg p-3">
                              {opera.culturalSignificance}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'info' && (
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-ink-light">谱式：</span>
              <span className="text-ink font-medium">
                {facePattern.patternType === 'symmetric' ? '对称谱' : '不对称谱'}
              </span>
            </div>
            <div>
              <span className="text-ink-light">主色：</span>
              <span 
                className="inline-block w-4 h-4 rounded-full align-middle mr-2 border border-ink/20"
                style={{ backgroundColor: facePattern.mainColor }}
              />
              <span className="text-ink font-medium">{facePattern.mainColor}</span>
            </div>
            <div>
              <span className="text-ink-light">辅色：</span>
              <span 
                className="inline-block w-4 h-4 rounded-full align-middle mr-2 border border-ink/20"
                style={{ backgroundColor: facePattern.secondaryColor }}
              />
              <span className="text-ink font-medium">{facePattern.secondaryColor}</span>
            </div>
            <div>
              <span className="text-ink-light">轮廓色：</span>
              <span 
                className="inline-block w-4 h-4 rounded-full align-middle mr-2 border border-ink/20"
                style={{ backgroundColor: facePattern.outlineColor }}
              />
              <span className="text-ink font-medium">{facePattern.outlineColor}</span>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gold/20">
            <p className="text-ink-light text-sm mb-1">图案特征：</p>
            <p className="text-ink leading-relaxed">{facePattern.patternFeatures}</p>
          </div>
        </div>
      )}

      {activeTab === 'color-symbolism' && (
        <div className="p-6">
          <div className="grid grid-cols-3 gap-3">
            {useStore.getState().colorSymbolism.map((symbol) => (
              <div
                key={symbol.id}
                className="flex flex-col items-center p-3 bg-paper-light rounded-lg border border-gold/20"
              >
                <div
                  className="w-10 h-10 rounded-full border-2 border-white shadow-md mb-2"
                  style={{ backgroundColor: symbol.hex }}
                />
                <span className="text-sm font-medium text-ink">{symbol.color}</span>
                <p className="text-xs text-ink-light text-center mt-1 line-clamp-2">
                  {symbol.meaning}
                </p>
                <p className="text-xs text-primary mt-1">代表：{symbol.examples}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OperaPanel;
