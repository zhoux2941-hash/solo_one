import { Sword, Scroll, Smile, Sparkles, Ghost } from 'lucide-react';
import { RoleType } from '../types';

interface RoleTypeNavProps {
  roleTypes: RoleType[];
  selectedRole: string;
  onSelectRole: (roleId: string) => void;
}

const roleIcons: Record<string, React.ReactNode> = {
  warrior: <Sword className="w-5 h-5" />,
  civilian: <Scroll className="w-5 h-5" />,
  clown: <Smile className="w-5 h-5" />,
  fairy: <Sparkles className="w-5 h-5" />,
  monster: <Ghost className="w-5 h-5" />,
};

const RoleTypeNav = ({ roleTypes, selectedRole, onSelectRole }: RoleTypeNavProps) => {
  return (
    <div className="bg-amber-50 border-b-2 border-amber-200 py-4 px-6">
      <div className="max-w-7xl mx-auto">
        <h3 className="text-amber-800 font-semibold mb-3 text-center">选择角色类型</h3>
        <div className="flex flex-wrap justify-center gap-3">
          {roleTypes.map((role) => (
            <button
              key={role.id}
              onClick={() => onSelectRole(role.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all duration-300 ${
                selectedRole === role.id
                  ? 'bg-amber-800 text-yellow-100 shadow-lg scale-105 border-2 border-yellow-500'
                  : 'bg-white text-amber-800 border-2 border-amber-200 hover:border-amber-400 hover:shadow-md'
              }`}
            >
              {roleIcons[role.id]}
              <span className="text-lg">{role.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoleTypeNav;
