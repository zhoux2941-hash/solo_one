import { useState, useEffect, useMemo } from 'react';
import { IpCalculator } from '@/utils/IpCalculator';
import { COMMON_MASKS } from '@/utils/ipv4';
import type { IpResult } from '@/types';
import ResultCard from './ResultCard';
import { AlertCircle, ChevronDown } from 'lucide-react';

export default function IPv4Calculator() {
  const [ipInput, setIpInput] = useState('192.168.1.100');
  const [maskInput, setMaskInput] = useState('255.255.255.0');
  const [cidrInput, setCidrInput] = useState('24');
  const [inputMode, setInputMode] = useState<'mask' | 'cidr'>('mask');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IpResult | null>(null);
  const [showMaskDropdown, setShowMaskDropdown] = useState(false);

  const handleCidrInput = (value: string) => {
    setCidrInput(value);
    const cidr = parseInt(value, 10);
    if (IpCalculator.isValidPrefix(cidr, 4)) {
      setMaskInput(IpCalculator.getSubnetMask(cidr, 4));
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

  const handleIpInput = (value: string) => {
    const parsed = IpCalculator.parseCidrInput(value);
    setIpInput(parsed.ip);
    if (parsed.prefix !== null && IpCalculator.isValidPrefix(parsed.prefix, 4)) {
      setCidrInput(parsed.prefix.toString());
      setMaskInput(IpCalculator.getSubnetMask(parsed.prefix, 4));
      setInputMode('cidr');
    }
  };

  const selectCommonMask = (cidr: number, mask: string) => {
    setCidrInput(cidr.toString());
    setMaskInput(mask);
    setShowMaskDropdown(false);
  };

  const calculationResult = useMemo(() => {
    try {
      if (!IpCalculator.isValidIPv4(ipInput)) {
        setError('请输入有效的IPv4地址');
        return null;
      }

      let prefix: number;
      if (inputMode === 'cidr') {
        const cidr = parseInt(cidrInput, 10);
        if (!IpCalculator.isValidPrefix(cidr, 4)) {
          setError('请输入有效的CIDR前缀 (0-32)');
          return null;
        }
        prefix = cidr;
      } else {
        if (!IpCalculator.isValidSubnetMask(maskInput)) {
          setError('请输入有效的子网掩码');
          return null;
        }
        const binary = maskInput.split('.').map(o => parseInt(o, 10).toString(2).padStart(8, '0')).join('');
        prefix = binary.replace(/0/g, '').length;
      }

      setError(null);
      return IpCalculator.calculate(ipInput, prefix);
    } catch (e) {
      setError(e instanceof Error ? e.message : '计算错误');
      return null;
    }
  }, [ipInput, maskInput, cidrInput, inputMode]);

  useEffect(() => {
    setResult(calculationResult);
  }, [calculationResult]);

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
          IPv4 地址计算
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              IP地址 <span className="text-slate-400">(支持 CIDR 格式，如 192.168.1.100/24)</span>
            </label>
            <input
              type="text"
              value={ipInput}
              onChange={(e) => handleIpInput(e.target.value)}
              placeholder="例如: 192.168.1.100"
              className={`w-full px-4 py-3 rounded-lg border font-mono transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                error && !IpCalculator.isValidIPv4(ipInput)
                  ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 focus:border-red-500'
                  : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:border-blue-500'
              }`}
            />
          </div>

          <div className="flex gap-4 mb-2">
            <button
              onClick={() => setInputMode('mask')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                inputMode === 'mask'
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              子网掩码
            </button>
            <button
              onClick={() => setInputMode('cidr')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                inputMode === 'cidr'
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              CIDR 前缀
            </button>
          </div>

          {inputMode === 'mask' ? (
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                子网掩码
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={maskInput}
                  onChange={(e) => handleMaskInput(e.target.value)}
                  placeholder="例如: 255.255.255.0"
                  className={`flex-1 px-4 py-3 rounded-lg border font-mono transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    error && !IpCalculator.isValidSubnetMask(maskInput)
                      ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 focus:border-red-500'
                      : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:border-blue-500'
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
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                CIDR 前缀 <span className="text-slate-400">(0-32)</span>
              </label>
              <div className="flex items-center gap-3">
                <span className="text-2xl text-slate-400 font-bold">/</span>
                <input
                  type="number"
                  min="0"
                  max="32"
                  value={cidrInput}
                  onChange={(e) => handleCidrInput(e.target.value)}
                  className={`flex-1 px-4 py-3 rounded-lg border font-mono transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${
                    error && !IpCalculator.isValidPrefix(parseInt(cidrInput, 10), 4)
                      ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 focus:border-red-500'
                      : 'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:border-blue-500'
                  }`}
                />
              </div>
              <input
                type="range"
                min="0"
                max="32"
                value={cidrInput}
                onChange={(e) => handleCidrInput(e.target.value)}
                className="w-full mt-3 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span>/0</span>
                <span>/16</span>
                <span>/24</span>
                <span>/32</span>
              </div>
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

      {result && <ResultCard result={result} />}
    </div>
  );
}
