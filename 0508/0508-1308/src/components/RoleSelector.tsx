import { useStore } from '../store/useStore';
import { fetchCharacters } from '../services/api';

const RoleSelector = () => {
  const { roles, selectedRoleId, setSelectedRoleId, setCharacters, setLoading, setError } = useStore();

  const handleRoleSelect = async (roleId: number) => {
    if (selectedRoleId === roleId) return;
    
    setSelectedRoleId(roleId);
    setLoading(true);
    setError(null);
    
    try {
      const chars = await fetchCharacters(roleId);
      setCharacters(chars);
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载人物列表失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-display text-ink mb-4 border-b-2 border-gold pb-2">
        选择角色类型
      </h2>
      <div className="grid grid-cols-5 gap-4">
        {roles.map((role, index) => (
          <button
            key={role.id}
            onClick={() => handleRoleSelect(role.id)}
            className={`
              relative p-6 rounded-xl transition-all duration-300
              flex flex-col items-center justify-center gap-2
              border-2 bg-paper-light
              hover:shadow-lg hover:-translate-y-1
              animate-fade-in-up
              ${selectedRoleId === role.id 
                ? 'border-gold shadow-gold/30 shadow-lg bg-paper-dark' 
                : 'border-transparent hover:border-gold/50'}
            `}
            style={{ animationDelay: `${index * 0.1}s`, opacity: 0 }}
          >
            <span className="text-4xl">{role.icon}</span>
            <span className="text-xl font-display text-ink">{role.name}</span>
            <span className="text-xs text-ink-light text-center">{role.description}</span>
            {selectedRoleId === role.id && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gold rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default RoleSelector;
