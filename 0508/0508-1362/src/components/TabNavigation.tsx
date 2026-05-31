import React from 'react';
import { FileCode, ListOrdered, TableProperties, Binary } from 'lucide-react';

export type TabType = 'header' | 'program' | 'section' | 'hex';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  programHeaderCount: number;
  sectionHeaderCount: number;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({
  activeTab,
  onTabChange,
  programHeaderCount,
  sectionHeaderCount,
}) => {
  const tabs = [
    { id: 'header' as TabType, label: 'ELF 头', icon: <FileCode className="w-4 h-4" />, badge: null },
    { id: 'program' as TabType, label: '程序头表', icon: <ListOrdered className="w-4 h-4" />, badge: programHeaderCount },
    { id: 'section' as TabType, label: '节头表', icon: <TableProperties className="w-4 h-4" />, badge: sectionHeaderCount },
    { id: 'hex' as TabType, label: '十六进制', icon: <Binary className="w-4 h-4" />, badge: null },
  ];

  return (
    <div className="border-b border-slate-700">
      <nav className="flex gap-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-all duration-200
              ${activeTab === tab.id
                ? 'text-blue-400'
                : 'text-slate-400 hover:text-slate-200'
              }`}
          >
            {tab.icon}
            {tab.label}
            {tab.badge !== null && (
              <span className={`px-1.5 py-0.5 text-xs rounded-full transition-colors
                ${activeTab === tab.id
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-slate-700 text-slate-400'
                }`}
              >
                {tab.badge}
              </span>
            )}
            {activeTab === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
};
