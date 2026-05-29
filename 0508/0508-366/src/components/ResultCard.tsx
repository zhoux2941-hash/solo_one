import CopyButton from './CopyButton';
import type { IpResult } from '@/types';
import { Globe2, Lock, Hash, Layers, Radio, Monitor, AlertTriangle, Info } from 'lucide-react';
import { getReservedRangesForIp, getReservedRangeTypeInfo } from '@/utils/ipv4';

interface ResultCardProps {
  result: IpResult;
}

export default function ResultCard({ result }: ResultCardProps) {
  const reservedRanges = getReservedRangesForIp(result.ipAddress);
  const items = [
    { label: 'IP地址', value: result.ipAddress, icon: Globe2 },
    { label: '子网掩码', value: result.subnetMask, icon: Layers },
    { label: 'CIDR', value: `/${result.prefixLength}`, icon: Hash },
    { label: '网络地址', value: result.networkAddress, icon: Globe2, highlight: true },
    { label: '广播地址', value: result.broadcastAddress, icon: Radio, highlight: true },
    { label: '可用主机范围', value: result.usableHostRange, icon: Monitor, highlight: true },
    { label: '可用主机数', value: result.usableHosts.toString(), icon: Hash },
    { label: '反掩码', value: result.wildcardMask, icon: Layers },
    ...(result.version === 4 ? [{ label: 'IP分类', value: result.ipClass || 'N/A', icon: Globe2 }] : []),
    { label: '地址类型', value: result.isPrivate ? '私网地址' : '公网地址', icon: Lock },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
        <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
        计算结果
      </h3>

      {reservedRanges.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">⚠️ 该IP地址属于以下保留地址段：</span>
          </div>
          <div className="space-y-2">
            {reservedRanges.map((range, idx) => {
              const typeInfo = getReservedRangeTypeInfo(range.type);
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${typeInfo.bgColor} ${typeInfo.borderColor} transition-all duration-200 hover:shadow-md`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeInfo.bgColor} ${typeInfo.textColor} border ${typeInfo.borderColor}`}>
                          {typeInfo.label}
                        </span>
                        <span className={`font-semibold ${typeInfo.textColor}`}>
                          {range.name}
                        </span>
                      </div>
                      <div className="font-mono text-sm text-slate-700 dark:text-slate-300 mb-1">
                        {range.range}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {range.description}
                      </p>
                    </div>
                    <Info className={`w-5 h-5 flex-shrink-0 ${typeInfo.textColor}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {result.version === 6 && result.ipv6Info && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800">
            <div className="text-sm text-cyan-700 dark:text-cyan-300 mb-1">压缩格式</div>
            <div className="font-mono text-slate-900 dark:text-white break-all">{result.ipv6Info.compressed}</div>
          </div>
          <div className="p-3 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 border border-cyan-200 dark:border-cyan-800">
            <div className="text-sm text-cyan-700 dark:text-cyan-300 mb-1">完整格式</div>
            <div className="font-mono text-slate-900 dark:text-white break-all">{result.ipv6Info.expanded}</div>
          </div>
          <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">网络大小</div>
            <div className="font-mono text-slate-900 dark:text-white">{result.ipv6Info.networkSize.toString()} 个地址</div>
          </div>
          <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">IPv6类型</div>
            <div className="text-slate-900 dark:text-white text-sm">
              {result.ipv6Info.isLinkLocal && '链路本地地址'}
              {result.ipv6Info.isUniqueLocal && '唯一本地地址'}
              {result.ipv6Info.isGlobalUnicast && '全局单播地址'}
              {!result.ipv6Info.isLinkLocal && !result.ipv6Info.isUniqueLocal && !result.ipv6Info.isGlobalUnicast && '其他类型'}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {items.map((item, index) => (
          <div
            key={index}
            className={`group p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
              item.highlight
                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <item.icon
                  className={`w-4 h-4 flex-shrink-0 ${
                    item.highlight
                      ? 'text-blue-500'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span
                  className={`text-sm ${
                    item.highlight
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {item.label}
                </span>
              </div>
              <CopyButton text={item.value} />
            </div>
            <div className="mt-1 pl-6 font-mono text-slate-900 dark:text-white break-all">
              {item.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          二进制表示
        </h4>
        <div className="space-y-2 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-20 text-slate-500 dark:text-slate-400">IP地址:</span>
            <span className="text-slate-700 dark:text-slate-300 break-all">
              {result.binaryRepresentation.ip}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 text-slate-500 dark:text-slate-400">子网掩码:</span>
            <span className="text-slate-700 dark:text-slate-300 break-all">
              {result.binaryRepresentation.mask}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-20 text-slate-500 dark:text-slate-400">网络地址:</span>
            <span className="text-blue-600 dark:text-blue-400 break-all">
              {result.binaryRepresentation.network}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
