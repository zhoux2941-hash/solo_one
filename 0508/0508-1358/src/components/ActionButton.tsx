import { ActionType } from '@/types/pet';
import { getActionLabel } from '@/utils/petUtils';

interface ActionButtonProps {
  action: ActionType;
  icon: string;
  onClick: () => void;
  disabled?: boolean;
  color: string;
}

const ActionButton = ({ action, icon, onClick, disabled = false, color }: ActionButtonProps) => {
  const label = getActionLabel(action);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative flex flex-col items-center justify-center
        w-24 h-24 rounded-sm
        border-b-4 border-r-4 border-gray-900
        border-t-2 border-l-2 border-white/30
        transition-all duration-150
        hover:scale-105 active:scale-95
        active:border-b-2 active:border-r-2
        active:translate-y-1 active:translate-x-1
        disabled:opacity-50 disabled:cursor-not-allowed
        disabled:hover:scale-100 disabled:active:scale-100
        focus:outline-none focus:ring-4 focus:ring-yellow-400/50
        pixel-btn
      `}
      style={{ backgroundColor: color }}
      aria-label={label}
    >
      <span className="text-3xl mb-1">{icon}</span>
      <span className="text-xs font-bold text-white pixel-text drop-shadow-md">
        {label}
      </span>
      
      <div className="absolute inset-0 bg-white/20 opacity-0 hover:opacity-100 transition-opacity" />
    </button>
  );
};

export default ActionButton;
