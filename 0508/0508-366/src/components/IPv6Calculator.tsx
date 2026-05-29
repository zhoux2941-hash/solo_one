import { useState, useEffect, useMemo } from 'react';
import { IpCalculator } from '@/utils/IpCalculator';
import type { IpResult } from '@/types';
import CopyButton from './CopyButton';
import { AlertCircle, Globe2, Hash, Shrink, Maximize2, Link, Globe } from 'lucide-react';

export default function IPv6Calculator() {
  const [ipInput, setIpInput] = useState('2001:db8::1');
  const [prefixInput, setPrefixInput] = useState('64');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IpResult | null>(null);

  const handleIpInput = (value: string) => {
    const parsed = IpCalculator.parseCidrInput(value);
    setIpInput(parsed.ip);
    if (parsed.prefix !== null && IpCalculator.isValidPrefix(parsed.prefix, 6)) {
      setPrefixInput(parsed.prefix.toString());
    }
  };

  const calculationResult = useMemo(() => {
    try {
      if (!IpCalculator.isValidIPv6(ipInput)) {
        setError('请输入有效的IPv6地址');
        return null;
      }

      const prefix = parseInt(prefixInput, 10);
      if (!IpCalculator.isValidPrefix(prefix, 6)) {
        setError('请输入有效的前缀长度 (0-128)');
        return null;
      }

      setError(null);
      return IpCalculator.calculate(ipInput, prefix);
    } catch (e) {
      setError(e instanceof Error ? e.message : '计算错误');
      return null;
    }
  }, [ipInput, prefixInput]);

  useEffect(() => {
    setResult(calculationResult);
  }, [calculationResult]);

  const addressTypeItems = result?.ipv6Info
    ? [
        { label: '链路本地', value: result.ipv6Info.isLinkLocal, icon: Link },
        { label: '唯一本地', value: result.ipv6Info.isUniqueLocal, icon: Globe },
        { label: '全局单播', value: result.ipv6Info.isGlobalUnicast, icon: Globe2 },
      ].filter((item) => item.value)
    : [];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-teal-500 rounded-full"></span>
          IPv6 地址计算
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              IPv6地址 <span className="text-slate-400">(支持 CIDR 格式)</span>
            </label>
            <input
              type="text"
              value={ipInput}
              onChange={(e) => handleIpInput(e.target.value)}
              placeholder="例如: 2001:db8::1"
              className={`w-full px-4 py-3 rounded-lg border font-mono transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50 ${
                error && !IpCalculator.isValidIPv6(ipInput)
                  ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 focus:border-red-500'
                  : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:border-teal-500'
              }`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              前缀长度 <span className="text-slate-400">(0-128)</span>
            </label>
            <div className="flex items-center gap-3">
              <span className="text-2xl text-slate-400 font-bold">/</span>
              <input
                type="number"
                min="0"
                max="128"
                value={prefixInput}
                onChange={(e) => setPrefixInput(e.target.value)}
                className={`flex-1 px-4 py-3 rounded-lg border font-mono transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-500/50 ${
                  error && !IpCalculator.isValidPrefix(parseInt(prefixInput, 10), 6)
                    ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 focus:border-red-500'
                    : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:border-teal-500'
                }`}
              />
            </div>
            <input
              type="range"
              min="0"
              max="128"
              value={prefixInput}
              onChange={(e) => setPrefixInput(e.target.value)}
              className="w-full mt-3 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
            />
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>/0</span>
              <span>/48</span>
              <span>/64</span>
              <span>/128</span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>
      </div>

      {result && result.ipv6Info && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-teal-500 rounded-full"></span>
            计算结果
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="group p-3 rounded-lg border bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 transition-all duration-200 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shrink className="w-4 h-4 text-teal-500" />
                  <span className="text-sm text-teal-700 dark:text-teal-300">压缩格式</span>
                </div>
                <CopyButton text={result.ipv6Info.compressed} />
              </div>
              <div className="mt-1 pl-6 font-mono text-slate-900 dark:text-white break-all">
                {result.ipv6Info.compressed}
              </div>
            </div>

            <div className="group p-3 rounded-lg border bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800 transition-all duration-200 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Maximize2 className="w-4 h-4 text-teal-500" />
                  <span className="text-sm text-teal-700 dark:text-teal-300">完整格式</span>
                </div>
                <CopyButton text={result.ipv6Info.expanded} />
              </div>
              <div className="mt-1 pl-6 font-mono text-slate-900 dark:text-white break-all text-xs">
                {result.ipv6Info.expanded}
              </div>
            </div>

            <div className="group p-3 rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 transition-all duration-200 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-500 dark:text-slate-400">前缀长度</span>
                </div>
                <CopyButton text={`/${result.prefixLength}`} />
              </div>
              <div className="mt-1 pl-6 font-mono text-slate-900 dark:text-white">
                /{result.prefixLength}
              </div>
            </div>

            <div className="group p-3 rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 transition-all duration-200 hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-500 dark:text-slate-400">网络地址</span>
                </div>
                <CopyButton text={result.networkAddress} />
              </div>
              <div className="mt-1 pl-6 font-mono text-slate-900 dark:text-white break-all">
                {result.networkAddress}
              </div>
            </div>

            <div className="group p-3 rounded-lg border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 transition-all duration-200 hover:shadow-md md:col-span-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-slate-400" />
                  <span className="text-sm text-slate-500 dark:text-slate-400">网络大小</span>
                </div>
                <CopyButton text={result.ipv6Info.networkSize.toString()} />
              </div>
              <div className="mt-1 pl-6 font-mono text-slate-900 dark:text-white">
                {result.ipv6Info.networkSize.toString()} 个地址
              </div>
            </div>
          </div>

          {addressTypeItems.length > 0 && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                地址类型
              </h4>
              <div className="flex flex-wrap gap-2">
                {addressTypeItems.map((item, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-sm"
                  >
                    <item.icon className="w-3.5 h-3.5" />
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
