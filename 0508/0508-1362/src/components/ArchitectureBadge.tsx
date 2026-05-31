import React from 'react';
import { ArchitectureInfo } from '../parser/ElfTypes';
import { Cpu } from 'lucide-react';

interface ArchitectureBadgeProps {
  architecture: ArchitectureInfo | null;
  machineCode: number;
  machineName: string;
}

export const ArchitectureBadge: React.FC<ArchitectureBadgeProps> = ({
  architecture,
  machineCode,
  machineName,
}) => {
  if (!architecture) {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700 text-slate-300 text-sm border border-slate-600">
        <Cpu className="w-4 h-4" />
        <span>{machineName} (0x{machineCode.toString(16)})</span>
      </div>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border animate-bounce-in"
      style={{
        backgroundColor: `${architecture.color}20`,
        borderColor: `${architecture.color}60`,
        color: architecture.color,
      }}
    >
      <Cpu className="w-4 h-4" />
      <span className="font-semibold">{architecture.name}</span>
      <span className="text-xs opacity-75">
        {architecture.bits}-bit {architecture.endianness === 'little' ? 'LE' : 'BE'}
      </span>
    </div>
  );
};
