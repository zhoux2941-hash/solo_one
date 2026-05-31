import React from 'react';
import { ElfHeader } from '../parser/ElfTypes';
import { ArchitectureBadge } from './ArchitectureBadge';
import { ArchitectureInfo } from '../parser/ElfTypes';
import {
  EI_CLASS_NAMES,
  EI_DATA_NAMES,
  EI_OSABI_NAMES,
  E_TYPE_NAMES,
} from '../parser/ElfConstants';
import { getMachineName } from '../parser/ElfParser';
import { FileCode, Hash, ArrowRight } from 'lucide-react';

interface ElfHeaderViewProps {
  header: ElfHeader;
  architecture: ArchitectureInfo | null;
}

export const ElfHeaderView: React.FC<ElfHeaderViewProps> = ({ header, architecture }) => {
  const formatHex = (value: bigint | number, pad: number = 8) => {
    const num = typeof value === 'bigint' ? value : BigInt(value);
    return `0x${num.toString(16).padStart(pad, '0')}`;
  };

  const infoItems = [
    { label: '魔数 (Magic)', value: `${Array.from(header.ident.slice(0, 4)).map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')} (${header.ei_mag})`, icon: <Hash className="w-4 h-4" /> },
    { label: '类别 (Class)', value: EI_CLASS_NAMES[header.ei_class] || `Unknown (${header.ei_class})`, icon: <FileCode className="w-4 h-4" /> },
    { label: '字节序 (Data)', value: EI_DATA_NAMES[header.ei_data] || `Unknown (${header.ei_data})`, icon: <ArrowRight className="w-4 h-4" /> },
    { label: '版本 (Version)', value: header.ei_version.toString() },
    { label: 'OS ABI', value: EI_OSABI_NAMES[header.ei_osabi] || `Unknown (${header.ei_osabi})` },
    { label: 'ABI 版本', value: header.ei_abiversion.toString() },
    { label: '文件类型', value: E_TYPE_NAMES[header.e_type] || `Unknown (0x${header.e_type.toString(16)})` },
    { label: '机器架构', value: getMachineName(header.e_machine) },
    { label: '入口点 (Entry)', value: formatHex(header.e_entry, header.ei_class === 2 ? 16 : 8) },
    { label: '程序头偏移', value: formatHex(header.e_phoff) },
    { label: '节头偏移', value: formatHex(header.e_shoff) },
    { label: '标志位', value: `0x${header.e_flags.toString(16).padStart(8, '0')}` },
    { label: 'ELF 头大小', value: `${header.e_ehsize} bytes` },
    { label: '程序头条目大小', value: `${header.e_phentsize} bytes` },
    { label: '程序头数量', value: header.e_phnum.toString() },
    { label: '节头条目大小', value: `${header.e_shentsize} bytes` },
    { label: '节头数量', value: header.e_shnum.toString() },
    { label: '节名字符串表索引', value: header.e_shstrndx.toString() },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <FileCode className="w-6 h-6 text-blue-400" />
          ELF 文件头
        </h2>
        <ArchitectureBadge
          architecture={architecture}
          machineCode={header.e_machine}
          machineName={getMachineName(header.e_machine)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {infoItems.map((item, index) => (
          <div
            key={item.label}
            className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-all duration-200 hover:bg-slate-800"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-center gap-2 text-slate-400 text-xs uppercase tracking-wider mb-1">
              {item.icon}
              {item.label}
            </div>
            <div className="font-mono text-slate-200 text-sm break-all">
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
