import React, { useState } from 'react';
import { ProgramHeader } from '../parser/ElfTypes';
import { PT_TYPE_NAMES, getProgramHeaderFlags } from '../parser/ElfConstants';
import { ListOrdered, ChevronUp, ChevronDown, Copy, CheckCheck } from 'lucide-react';
import { formatHashShort } from '../parser/HashUtils';

interface ProgramHeaderTableProps {
  headers: ProgramHeader[];
  is64Bit: boolean;
  onComputeHash?: (index: number) => void;
  isComputingHashes?: boolean;
}

type SortField = Exclude<keyof ProgramHeader, 'hash'> | 'type_name';
type SortDirection = 'asc' | 'desc';

export const ProgramHeaderTable: React.FC<ProgramHeaderTableProps> = ({
  headers,
  is64Bit,
  onComputeHash,
  isComputingHashes,
}) => {
  const [sortField, setSortField] = useState<SortField>('index');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [filterType, setFilterType] = useState<string>('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const formatHex = (value: bigint | number, pad: number = 8) => {
    const num = typeof value === 'bigint' ? value : BigInt(value);
    return `0x${num.toString(16).padStart(pad, '0')}`;
  };

  const getTypeName = (type: number) => {
    return PT_TYPE_NAMES[type] || `0x${type.toString(16)}`;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const filteredHeaders = headers.filter(h => {
    if (!filterType) return true;
    const typeName = getTypeName(h.p_type).toLowerCase();
    return typeName.includes(filterType.toLowerCase());
  });

  const sortedHeaders = [...filteredHeaders].sort((a, b) => {
    let aVal: string | number | bigint;
    let bVal: string | number | bigint;

    if (sortField === 'type_name') {
      aVal = getTypeName(a.p_type);
      bVal = getTypeName(b.p_type);
    } else {
      aVal = a[sortField as Exclude<keyof ProgramHeader, 'hash'>] as string | number | bigint;
      bVal = b[sortField as Exclude<keyof ProgramHeader, 'hash'>] as string | number | bigint;
    }

    if (typeof aVal === 'bigint' && typeof bVal === 'bigint') {
      return sortDirection === 'asc' ? (aVal < bVal ? -1 : 1) : (aVal > bVal ? -1 : 1);
    }
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    return sortDirection === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal));
  });

  const padLength = is64Bit ? 16 : 8;

  interface Column {
    key: SortField | 'hash';
    label: string;
    sortable: boolean;
    width?: string;
  }

  const columns: Column[] = [
    { key: 'index', label: '#', sortable: true, width: 'w-12' },
    { key: 'type_name', label: '类型', sortable: true, width: 'w-32' },
    { key: 'p_flags', label: '标志', sortable: true, width: 'w-16' },
    { key: 'p_offset', label: '偏移', sortable: true },
    { key: 'p_filesz', label: '大小', sortable: true, width: 'w-28' },
    { key: 'hash', label: 'SHA-256 哈希', sortable: false, width: 'w-44' },
  ];

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc'
      ? <ChevronUp className="w-3 h-3 inline" />
      : <ChevronDown className="w-3 h-3 inline" />;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <ListOrdered className="w-6 h-6 text-emerald-400" />
          程序头表
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            {headers.length} 个条目
          </span>
        </h2>
        <input
          type="text"
          placeholder="按类型过滤..."
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-3 py-1.5 text-sm bg-slate-800 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors w-48"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-800/30">
        <table className="w-full text-sm">
          <thead className="bg-slate-800 sticky top-0">
            <tr className="text-slate-400 text-left">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 font-medium ${col.width || ''} ${
                    col.sortable ? 'cursor-pointer hover:text-slate-200 select-none' : ''
                  }`}
                  onClick={() => col.sortable && handleSort(col.key as SortField)}
                >
                  {col.label}
                  {col.sortable && <SortIcon field={col.key as SortField} />}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-700/50">
            {sortedHeaders.map((ph, idx) => (
              <tr
                key={ph.index}
                className={`font-mono hover:bg-slate-700/30 transition-colors ${
                  idx % 2 === 0 ? 'bg-slate-800/20' : ''
                }`}
              >
                <td className="px-4 py-2 text-slate-500">{ph.index}</td>
                <td className="px-4 py-2">
                  <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-xs font-medium">
                    {getTypeName(ph.p_type)}
                  </span>
                </td>
                <td className="px-4 py-2 text-slate-300 font-bold tracking-wider">
                  {getProgramHeaderFlags(ph.p_flags)}
                </td>
                <td className="px-4 py-2 text-slate-200">{formatHex(ph.p_offset)}</td>
                <td className="px-4 py-2 text-slate-200">{formatHex(ph.p_filesz)}</td>
                <td className="px-4 py-2">
                  {ph.hash ? (
                    <div className="flex items-center gap-2 group">
                      <span
                        className="text-xs text-emerald-400 cursor-help"
                        title={`SHA-256: ${ph.hash.sha256}\nSHA-1: ${ph.hash.sha1}`}
                      >
                        {formatHashShort(ph.hash.sha256, 16)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(ph.hash!.sha256, `ph-${ph.index}-sha256`)}
                        className="p-1 rounded hover:bg-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="复制 SHA-256"
                      >
                        {copiedHash === `ph-${ph.index}-sha256` ? (
                          <CheckCheck className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400" />
                        )}
                      </button>
                    </div>
                  ) : ph.p_filesz > 0n ? (
                    <button
                      onClick={() => onComputeHash?.(ph.index)}
                      disabled={isComputingHashes}
                      className="text-xs text-slate-500 hover:text-blue-400 disabled:opacity-50 transition-colors"
                    >
                      {isComputingHashes ? '计算中...' : '点击计算哈希'}
                    </button>
                  ) : (
                    <span className="text-xs text-slate-600">无数据</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sortedHeaders.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            没有匹配的程序头条目
          </div>
        )}
      </div>
    </div>
  );
};
