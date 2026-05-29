import { useState } from 'react';
import Header from '@/components/Header';
import IPv4Calculator from '@/components/IPv4Calculator';
import IPv6Calculator from '@/components/IPv6Calculator';
import Subnetting from '@/components/Subnetting';
import type { TabType } from '@/types';
import { Globe2, Globe, Layers } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('ipv4');

  const tabs = [
    { id: 'ipv4' as TabType, label: 'IPv4 计算', icon: Globe2, color: 'blue' },
    { id: 'ipv6' as TabType, label: 'IPv6 计算', icon: Globe, color: 'teal' },
    { id: 'subnet' as TabType, label: '子网划分', icon: Layers, color: 'amber' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center animate-fade-in">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">
            IP地址与子网计算工具
          </h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            支持IPv4/IPv6地址计算、网络地址/广播地址/主机范围计算、CIDR格式转换、子网划分等功能
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group relative inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? tab.color === 'blue'
                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 scale-105'
                    : tab.color === 'teal'
                    ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30 scale-105'
                    : 'bg-amber-500 text-white shadow-lg shadow-amber-500/30 scale-105'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="animate-slide-up">
          {activeTab === 'ipv4' && <IPv4Calculator />}
          {activeTab === 'ipv6' && <IPv6Calculator />}
          {activeTab === 'subnet' && <Subnetting />}
        </div>

        <footer className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-700 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            纯前端计算，所有数据均在本地处理，不上传服务器
          </p>
        </footer>
      </main>
    </div>
  );
}
