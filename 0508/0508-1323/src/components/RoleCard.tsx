import { Zap, Check } from 'lucide-react';
import { Role } from '../types';
import { cn } from '../lib/utils';

interface RoleCardProps {
  role: Role;
  isSelected?: boolean;
  onSelect?: (role: Role) => void;
  disabled?: boolean;
}

export function RoleCard({ role, isSelected, onSelect, disabled }: RoleCardProps) {
  return (
    <div
      onClick={() => !disabled && onSelect?.(role)}
      className={cn(
        "relative group cursor-pointer transition-all duration-500 ease-out",
        "hover:scale-105 hover:-translate-y-2",
        isSelected && "scale-105 -translate-y-2",
        disabled && "opacity-60 cursor-not-allowed hover:scale-100 hover:translate-y-0"
      )}
    >
      <div className="relative bg-gradient-to-br from-ivory to-white rounded-2xl overflow-hidden shadow-batik">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <pattern id={`role-pattern-${role.id}`} x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
              <path d="M0 6 L6 0 L12 6 L6 12 Z" fill={role.color} />
            </pattern>
            <rect width="100%" height="100%" fill={`url(#role-pattern-${role.id})`} />
          </svg>
        </div>

        <div
          className="absolute top-0 left-0 right-0 h-2"
          style={{ backgroundColor: role.color }}
        />

        <div className={cn(
          "absolute inset-0 rounded-2xl transition-all duration-500",
          "border-4 border-transparent",
          isSelected && "border-gold shadow-lg shadow-gold/30",
          !isSelected && !disabled && "group-hover:border-embroidery-red/50"
        )}>
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" style={{ opacity: isSelected ? 1 : 0 }}>
            <defs>
              <pattern id={`embroidery-${role.id}`} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
                <path d="M0 4 L4 0 L8 4 L4 8 Z" fill="none" stroke="#D4AF37" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#embroidery-${role.id})`} rx="12" />
          </svg>
        </div>

        {isSelected && (
          <div className="absolute -top-3 -right-3 z-10">
            <div className="relative">
              <div className="w-8 h-8 bg-gold rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                <Check className="w-5 h-5 text-white" />
              </div>
              <div className="absolute inset-0 bg-gold rounded-full animate-ping opacity-50" />
            </div>
          </div>
        )}

        <div className="relative p-6">
          <div className="flex justify-center mb-4">
            <div className={cn(
              "relative w-24 h-24 rounded-full flex items-center justify-center text-5xl",
              "transition-all duration-500 transform",
              isSelected ? "scale-110" : "group-hover:scale-110"
            )}
            style={{
              background: `radial-gradient(circle, ${role.color}33 0%, ${role.color}11 70%, transparent 100%)`,
              boxShadow: isSelected ? `0 0 30px ${role.color}66` : 'none'
            }}
            >
              <div className={cn(
                "absolute inset-0 rounded-full border-4 transition-all duration-500",
                isSelected ? "border-gold" : "border-transparent group-hover:border-gold/50"
              )} />
              <div className="absolute -inset-2 rounded-full opacity-20" style={{ backgroundColor: role.color }} />
              <span className="relative z-10 drop-shadow-lg">{role.avatar}</span>
            </div>
          </div>

          <h3
            className="font-baicalligraphy text-2xl text-center mb-2"
            style={{ color: role.color }}
          >
            {role.name}
          </h3>

          <p className="text-sm text-indigo-batik/70 text-center mb-4 line-clamp-3">
            {role.description}
          </p>

          <div className="bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 rounded-xl p-3 border border-gold/20">
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-gold to-embroidery-red rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gold mb-1">专属技能</p>
                <p className="text-xs text-indigo-batik/80">{role.skill}</p>
              </div>
            </div>
          </div>

          {!disabled && (
            <button
              className={cn(
                "w-full mt-4 py-3 rounded-xl font-medium transition-all duration-300",
                isSelected
                  ? "bg-gradient-to-r from-gold to-embroidery-red text-white shadow-lg"
                  : "bg-white text-indigo-batik border-2 border-indigo-batik/20 hover:border-embroidery-red hover:text-embroidery-red"
              )}
            >
              {isSelected ? '已选择' : '选择角色'}
            </button>
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      <div
        className="absolute inset-0 -z-10 rounded-2xl blur-xl opacity-0 transition-opacity duration-500 group-hover:opacity-40"
        style={{ backgroundColor: role.color }}
      />
    </div>
  );
}
