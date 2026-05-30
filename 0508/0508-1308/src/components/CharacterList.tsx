import { useStore } from '../store/useStore';
import { fetchFacePattern } from '../services/api';
import { User } from 'lucide-react';

const CharacterList = () => {
  const { 
    characters, 
    selectedRoleId, 
    selectedCharacterId, 
    setSelectedCharacterId, 
    setFacePattern,
    setLoading,
    setError 
  } = useStore();

  const handleCharacterSelect = async (characterId: number) => {
    if (selectedCharacterId === characterId) return;
    
    setSelectedCharacterId(characterId);
    setLoading(true);
    setError(null);
    
    try {
      const pattern = await fetchFacePattern(characterId);
      setFacePattern(pattern);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载脸谱详情失败');
    } finally {
      setLoading(false);
    }
  };

  if (!selectedRoleId) {
    return (
      <div className="p-8 text-center text-ink-light bg-paper rounded-xl border-2 border-dashed border-gold/30">
        <p className="text-lg">请先选择角色类型</p>
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="p-8 text-center text-ink-light bg-paper rounded-xl border-2 border-dashed border-gold/30">
        <p className="text-lg">该角色类型暂无人物数据</p>
      </div>
    );
  }

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-display text-ink mb-4 border-b-2 border-gold pb-2">
        选择人物
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {characters.map((char, index) => (
          <button
            key={char.id}
            onClick={() => handleCharacterSelect(char.id)}
            className={`
              relative p-4 rounded-xl transition-all duration-300
              flex flex-col items-center gap-2
              border-2 bg-paper-light
              hover:shadow-lg hover:-translate-y-1
              animate-fade-in-up
              ${selectedCharacterId === char.id 
                ? 'border-gold shadow-gold/30 shadow-lg bg-paper-dark ring-2 ring-gold/30' 
                : 'border-transparent hover:border-gold/50'}
            `}
            style={{ animationDelay: `${index * 0.05}s`, opacity: 0 }}
          >
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center
              ${selectedCharacterId === char.id ? 'bg-gold' : 'bg-primary/10'}
              transition-colors duration-300
            `}>
              <User className={`w-8 h-8 ${selectedCharacterId === char.id ? 'text-white' : 'text-primary'}`} />
            </div>
            <div className="text-center">
              <p className="text-lg font-display text-ink">{char.name}</p>
              {char.alias && (
                <p className="text-xs text-ink-light">({char.alias})</p>
              )}
            </div>
            {selectedCharacterId === char.id && (
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-gold rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CharacterList;
