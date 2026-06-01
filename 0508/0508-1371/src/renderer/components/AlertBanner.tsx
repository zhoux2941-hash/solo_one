import { AlertTriangle, AlertCircle, Info, XCircle, X } from 'lucide-react';
import { useState } from 'react';

type Severity = 'info' | 'warning' | 'error' | 'critical';

interface AlertBannerProps {
  severity: Severity;
  message: string;
  title?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const severityConfig = {
  info: {
    icon: Info,
    bgColor: 'bg-cyber-blue/20',
    borderColor: 'border-cyber-blue',
    textColor: 'text-cyber-blue',
    shadowColor: 'shadow-neon-cyan',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-cyber-yellow/20',
    borderColor: 'border-cyber-yellow',
    textColor: 'text-cyber-yellow',
    shadowColor: 'shadow-neon-yellow',
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-cyber-orange/20',
    borderColor: 'border-cyber-orange',
    textColor: 'text-cyber-orange',
    shadowColor: 'shadow-neon-yellow',
  },
  critical: {
    icon: XCircle,
    bgColor: 'bg-cyber-red/20',
    borderColor: 'border-cyber-red',
    textColor: 'text-cyber-red',
    shadowColor: 'shadow-neon-red',
  },
};

export default function AlertBanner({
  severity,
  message,
  title,
  dismissible = false,
  onDismiss,
}: AlertBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const config = severityConfig[severity];
  const Icon = config.icon;

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <div
      className={`w-full ${config.bgColor} border ${config.borderColor} rounded-lg p-4 relative overflow-hidden`}
    >
      <div
        className={`absolute top-0 left-0 right-0 h-0.5 ${
          severity === 'critical' ? 'animate-pulse' : ''
        }`}
        style={{
          background: `linear-gradient(90deg, transparent, currentColor, transparent)`,
        }}
      />

      <div className="flex items-start gap-3">
        <div className={`${config.textColor} flex-shrink-0 mt-0.5`}>
          <Icon
            className={`w-5 h-5 ${severity === 'critical' ? 'animate-pulse' : ''}`}
          />
        </div>

        <div className="flex-1 min-w-0">
          {title && (
            <h4 className={`font-semibold text-sm ${config.textColor} mb-1`}>
              {title}
            </h4>
          )}
          <p className="text-sm text-cyber-text">{message}</p>
        </div>

        {dismissible && (
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded hover:bg-cyber-border/50 transition-colors"
          >
            <X className="w-4 h-4 text-cyber-muted" />
          </button>
        )}
      </div>

      {severity === 'critical' && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 10px,
                currentColor 10px,
                currentColor 20px
              )`,
              animation: 'scan-line 1s linear infinite',
            }}
          />
        </div>
      )}
    </div>
  );
}
