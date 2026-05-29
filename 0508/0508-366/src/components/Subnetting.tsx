import { useState, useEffect, useMemo, useRef } from 'react';
import { IpCalculator } from '@/utils/IpCalculator';
import type { SubnettingResult, SubnetMode, SubnetRequest } from '@/types';
import { COMMON_MASKS } from '@/utils/ipv4';
import CopyButton from './CopyButton';
import { AlertCircle, ChevronDown, Layers, Monitor, Hash, ChevronLeft, ChevronRight, Plus, Trash2, Settings2 } from 'lucide-react';

const PAGE_SIZE = 16;

export default function Subnetting() {
  const [ipInput, setIpInput] = useState('192.168.1.0');
  const [maskInput, setMaskInput] = useState('255.255.255.0');
  const [cidrInput, setCidrInput] = useState('24');
  const [mode, setMode] = useState<SubnetMode>('count');
  const [subnetCountInput, setSubnetCountInput] = useState('4');
  const [hostsInput, setHostsInput] = useState('50');
  const [customRequests, setCustomRequests] = useState<SubnetRequest[]>([
    { prefixLength: 26, count: 3 },
    { prefixLength: 25, count: 1 }
  ]);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubnettingResult | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showMaskDropdown, setShowMaskDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowMaskDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleIpInput = (value: string) => {
    const parsed = IpCalculator.parseCidrInput(value);
    setIpInput(parsed.ip);
    if (parsed.prefix !== null && IpCalculator.isValidPrefix(parsed.prefix, 4)) {
      setCidrInput(parsed.prefix.toString());
      setMaskInput(IpCalculator.getSubnetMask(parsed.prefix, 4));
    }
  };

  const handleMaskInput = (value: string) => {
    setMaskInput(value);
    if (IpCalculator.isValidSubnetMask(value)) {
      const binary = value.split('.').map(o => parseInt(o, 10).toString(2).padStart(8, '0')).join('');
      const cidr = binary.replace(/0/g, '').length;
      setCidrInput(cidr.toString());
    }
  };

  const selectCommonMask = (cidr: number, mask: string) => {
    setCidrInput(cidr.toString());
    setMaskInput(mask);
    setShowMaskDropdown(false);
  };

  const addCustomRequest = () => {
    setCustomRequests([...customRequests, { prefixLength: 28, count: 1 }]);
  };

  const removeCustomRequest = (index: number) => {
    setCustomRequests(customRequests.filter((_, i) => i !== index));
  };

  const updateCustomRequest = (index: number, field: keyof SubnetRequest, value: number) => {
    const updated = [...customRequests];
    updated[index] = { ...updated[index], [field]: value };
    setCustomRequests(updated);
  };

  const totalPages = useMemo(() => {
    if (!result) return 1;
    return Math.ceil(result.subnets.length / PAGE_SIZE);
  }, [result]);

  const paginatedSubnets = useMemo(() => {
    if (!result) return [];
    const start = (currentPage - 1) * PAGE_SIZE;
    return result.subnets.slice(start, start + PAGE_SIZE);
  }, [result, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [result]);

  const calculationResult = useMemo(() => {
    try {
      if (!IpCalculator.isValidIPv4(ipInput)) {
        setError('请输入有效的IPv4地址');
        return null;
      }

      if (!IpCalculator.isValidSubnetMask(maskInput)) {
        setError('请输入有效的子网掩码');
        return null;
      }

      const originalCidr = parseInt(cidrInput, 10);

      if (mode === 'count') {
        const count = parseInt(subnetCountInput, 10);
        if (isNaN(count) || count < 1) {
          setError('请输入有效的子网数量 (>=1)');
          return null;
        }
        setError(null);
        return IpCalculator.subnetByCount(ipInput, originalCidr, count);
      } else if (mode === 'hosts') {
        const hosts = parseInt(hostsInput, 10);
        if (isNaN(hosts) || hosts < 1) {
          setError('请输入有效的主机数量 (>=1)');
          return null;
        }
        setError(null);
        return IpCalculator.subnetByHosts(ipInput, originalCidr, hosts);
      } else {
        if (customRequests.length === 0) {
          setError('请至少添加一个子网请求');
          return null;
        }
        setError(null);
        return IpCalculator.subnetRecursive(ipInput, originalCidr, customRequests);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '计算错误');
      return null;
    }
  }, [ipInput, maskInput, cidrInput, mode, subnetCountInput, hostsInput, customRequests]);

  useEffect(() => {
    setResult(calculationResult);
  }, [calculationResult]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-amber-500 rounded-full"></span>
          子网划分
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                网络地址 <span className="text-slate-400">(支持 CIDR)</span>
              </label>
              <input
                type="text"
                value={ipInput}
                onChange={(e) => handleIpInput(e.target.value)}
                placeholder="例如: 192.168.1.0"
                className={`w-full px-4 py-3 rounded-lg border font-mono transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                  error && !IpCalculator.isValidIPv4(ipInput)
                    ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 focus:border-red-500'
                    : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:border-amber-500'
                }`}
              />
            </div>

            <div className="relative" ref={dropdownRef}>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                子网掩码 / CIDR
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={maskInput}
                  onChange={(e) => handleMaskInput(e.target.value)}
                  placeholder="例如: 255.255.255.0"
                  className={`flex-1 px-4 py-3 rounded-lg border font-mono transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                    error && !IpCalculator.isValidSubnetMask(maskInput)
                      ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 focus:border-red-500'
                      : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:border-amber-500'
                  }`}
                />
                <button
                  onClick={() => setShowMaskDropdown(!showMaskDropdown)}
                  className="px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${showMaskDropdown ? 'rotate-180' : ''}`} />
                </button>
              </div>
              {showMaskDropdown && (
                <div className="absolute z-10 mt-2 w-full bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-lg overflow-hidden">
                  <div className="p-2 max-h-60 overflow-y-auto">
                    <div className="text-xs text-slate-500 dark:text-slate-400 px-3 py-2 font-medium">
                      常用掩码
                    </div>
                    {COMMON_MASKS.map((item) => (
                      <button
                        key={item.cidr}
                        onClick={() => selectCommonMask(item.cidr, item.mask)}
                        className="w-full text-left px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 font-mono text-sm text-slate-700 dark:text-slate-200 flex justify-between"
                      >
                        <span>/{item.cidr}</span>
                        <span>{item.mask}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 mb-2 flex-wrap">
            <button
              onClick={() => setMode('count')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === 'count'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              按子网数量划分
            </button>
            <button
              onClick={() => setMode('hosts')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                mode === 'hosts'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              按主机数量划分
            </button>
            <button
              onClick={() => setMode('custom')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                mode === 'custom'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              <Settings2 className="w-4 h-4" />
              自定义划分
            </button>
          </div>

          {mode === 'count' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                需要的子网数量
              </label>
              <input
                type="number"
                min="1"
                value={subnetCountInput}
                onChange={(e) => setSubnetCountInput(e.target.value)}
                placeholder="例如: 4"
                className={`w-full px-4 py-3 rounded-lg border font-mono transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                  error && (isNaN(parseInt(subnetCountInput, 10)) || parseInt(subnetCountInput, 10) < 1)
                    ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 focus:border-red-500'
                    : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:border-amber-500'
                }`}
              />
            </div>
          )}

          {mode === 'hosts' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                每个子网所需主机数
              </label>
              <input
                type="number"
                min="1"
                value={hostsInput}
                onChange={(e) => setHostsInput(e.target.value)}
                placeholder="例如: 50"
                className={`w-full px-4 py-3 rounded-lg border font-mono transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 ${
                  error && (isNaN(parseInt(hostsInput, 10)) || parseInt(hostsInput, 10) < 1)
                    ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 focus:border-red-500'
                    : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:border-amber-500'
                }`}
              />
            </div>
          )}

          {mode === 'custom' && (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                自定义子网请求 (支持非均匀划分)
              </label>
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                示例: 3个/26 + 1个/25 = 将/24划分为3个/26子网和1个/25子网
              </div>
              {customRequests.map((request, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm text-slate-500 dark:text-slate-400 w-8">
                    {index + 1}.
                  </span>
                  <select
                    value={request.count}
                    onChange={(e) => updateCustomRequest(index, 'count', parseInt(e.target.value, 10))}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                      <option key={n} value={n}>{n}个</option>
                    ))}
                  </select>
                  <span className="text-2xl text-slate-400 font-bold">/</span>
                  <select
                    value={request.prefixLength}
                    onChange={(e) => updateCustomRequest(index, 'prefixLength', parseInt(e.target.value, 10))}
                    className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm font-mono"
                  >
                    {[24, 25, 26, 27, 28, 29, 30].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => removeCustomRequest(index)}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                onClick={addCustomRequest}
                className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
              >
                <Plus className="w-4 h-4" />
                添加子网请求
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>
      </div>

      {result && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-1 h-6 bg-amber-500 rounded-full"></span>
            划分结果
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300 mb-1">
                <Layers className="w-4 h-4" />
                原始网络
              </div>
              <div className="font-mono text-slate-900 dark:text-white">
                {result.originalNetwork}/{result.originalPrefix}
              </div>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300 mb-1">
                <Hash className="w-4 h-4" />
                子网总数
              </div>
              <div className="font-mono text-slate-900 dark:text-white">
                {result.subnets.length} 个
              </div>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300 mb-1">
                <Monitor className="w-4 h-4" />
                最小主机数
              </div>
              <div className="font-mono text-slate-900 dark:text-white">
                {result.subnets.length > 0 ? Math.min(...result.subnets.map(s => Number(s.usableHosts))).toLocaleString() : 0} 个
              </div>
            </div>
            <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300 mb-1">
                <Layers className="w-4 h-4" />
                剩余空间
              </div>
              <div className="font-mono text-slate-900 dark:text-white">
                {result.remainingRanges.length} 块
              </div>
            </div>
          </div>

          {result.remainingRanges.length > 0 && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-lg">
              <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                剩余可用地址块
              </h4>
              <div className="flex flex-wrap gap-2">
                {result.remainingRanges.map((range, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm font-mono"
                  >
                    {range.networkAddress}/{range.prefixLength}
                    <span className="text-xs text-slate-500">({range.size.toString()}个)</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {result.subnets.length > 256 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-700 dark:text-amber-300 text-sm">
              ⚠️ 共 {result.subnets.length} 个子网，仅显示前 256 个
            </div>
          )}

          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">#</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">网络地址</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">广播地址</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">可用主机范围</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">可用主机数</th>
                    <th className="px-4 py-3 text-left font-medium text-slate-600 dark:text-slate-300">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {paginatedSubnets.map((subnet, index) => (
                    <tr
                      key={subnet.index}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                        index % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50/50 dark:bg-slate-800/50'
                      }`}
                    >
                      <td className="px-4 py-3 text-slate-500 dark:text-slate-400 font-mono">
                        {subnet.index}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-900 dark:text-white">
                        {subnet.networkAddress}/{subnet.prefixLength}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-900 dark:text-white">
                        {subnet.broadcastAddress}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-900 dark:text-white">
                        {subnet.usableHostRange}
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                        {subnet.usableHosts.toString()}
                      </td>
                      <td className="px-4 py-3">
                        <CopyButton text={`网络: ${subnet.networkAddress}/${subnet.prefixLength}\n可用: ${subnet.usableHostRange}`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-700/50 border-t border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  第 {currentPage} / {totalPages} 页，共 {result.subnets.length} 个子网
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
