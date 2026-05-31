import React, { useState } from 'react';
import { Table2, ChevronDown, ChevronRight, Route } from 'lucide-react';
import { useNetworkStore } from '../store/networkStore';
import { getNodeById } from '../utils/network';

export const RoutingTable: React.FC = () => {
  const { nodes, routingTables, calculateRoutingTables, clearRoutingTables } = useNetworkStore();
  const [expandedNode, setExpandedNode] = useState<string | null>(null);

  const hasTables = routingTables.length > 0;
  const hasNodes = nodes.length >= 2;

  const toggleNode = (nodeId: string) => {
    setExpandedNode(expandedNode === nodeId ? null : nodeId);
  };

  const getNodeName = (nodeId: string) => {
    return getNodeById(nodes, nodeId)?.name || nodeId;
  };

  return (
    <div className="bg-dark-800 rounded-lg border border-dark-700">
      <div className="p-4 border-b border-dark-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-dark-200 flex items-center gap-2">
          <Route size={16} className="text-accent-500" />
          路由表
        </h3>
        <div className="flex gap-2">
          {hasTables && (
            <button
              onClick={clearRoutingTables}
              className="px-2 py-1 text-xs bg-dark-900 border border-dark-600 rounded hover:border-dark-500 text-dark-300 hover:text-white transition-colors"
            >
              清除
            </button>
          )}
          <button
            onClick={calculateRoutingTables}
            disabled={!hasNodes}
            className={`px-3 py-1 text-xs rounded transition-colors flex items-center gap-1 ${
              hasNodes
                ? 'bg-accent-600 hover:bg-accent-500 text-white'
                : 'bg-dark-700 text-dark-500 cursor-not-allowed'
            }`}
          >
            <Table2 size={12} />
            计算路由
          </button>
        </div>
      </div>

      <div className="max-h-80 overflow-y-auto scrollbar-thin">
        {!hasNodes && (
          <div className="p-6 text-center">
            <p className="text-sm text-dark-500">至少需要2个节点才能计算路由表</p>
          </div>
        )}

        {hasNodes && !hasTables && (
          <div className="p-6 text-center">
            <p className="text-sm text-dark-500">点击「计算路由」按钮生成路由表</p>
          </div>
        )}

        {hasTables && routingTables.map((table) => {
          const nodeName = getNodeName(table.nodeId);
          const isExpanded = expandedNode === table.nodeId;
          const node = getNodeById(nodes, table.nodeId);
          const sourceNode = nodes.find(n => n.isSource);
          const targetNode = nodes.find(n => n.isTarget);
          
          const isSource = node?.isSource;
          const isTarget = node?.isTarget;

          return (
            <div key={table.nodeId} className="border-b border-dark-700 last:border-b-0">
              <button
                onClick={() => toggleNode(table.nodeId)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-dark-700/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? <ChevronDown size={14} className="text-dark-400" /> : <ChevronRight size={14} className="text-dark-400" />}
                  <span className={`text-sm font-medium ${
                    isSource ? 'text-green-400' : isTarget ? 'text-red-400' : 'text-dark-200'
                  }`}>
                    {nodeName}
                  </span>
                  <span className="text-xs text-dark-500">
                    (最大跳数: {node?.maxHops || '-'})
                  </span>
                </div>
                <span className="text-xs text-dark-500">
                  {table.entries.filter(e => e.hops >= 0).length}/{table.entries.length} 可达
                </span>
              </button>

              {isExpanded && (
                <div className="px-4 pb-3">
                  <div className="bg-dark-900 rounded overflow-hidden border border-dark-700">
                    <table className="w-full text-xs">
                      <thead className="bg-dark-800">
                        <tr>
                          <th className="px-3 py-2 text-left text-dark-400 font-medium">目标</th>
                          <th className="px-3 py-2 text-left text-dark-400 font-medium">下一跳</th>
                          <th className="px-3 py-2 text-center text-dark-400 font-medium">跳数</th>
                          <th className="px-3 py-2 text-right text-dark-400 font-medium">衰减</th>
                        </tr>
                      </thead>
                      <tbody>
                        {table.entries.map((entry) => {
                          const targetName = getNodeName(entry.targetId);
                          const isTargetNode = targetNode?.id === entry.targetId;
                          const isSourceNode = sourceNode?.id === entry.targetId;
                          const isReachable = entry.hops >= 0;

                          return (
                            <tr key={entry.targetId} className="border-t border-dark-700">
                              <td className={`px-3 py-2 ${
                                isReachable
                                  ? isTargetNode ? 'text-red-400' : isSourceNode ? 'text-green-400' : 'text-dark-200'
                                  : 'text-dark-600'
                              }`}>
                                {targetName}
                              </td>
                              <td className={`px-3 py-2 font-mono ${
                                isReachable ? 'text-accent-400' : 'text-dark-600'
                              }`}>
                                {isReachable ? entry.nextHopName : '不可达'}
                              </td>
                              <td className={`px-3 py-2 text-center font-mono ${
                                isReachable
                                  ? entry.hops > (node?.maxHops || 5) / 2
                                    ? 'text-yellow-400'
                                    : 'text-green-400'
                                  : 'text-dark-600'
                              }`}>
                                {isReachable ? entry.hops : '-'}
                              </td>
                              <td className={`px-3 py-2 text-right font-mono ${
                                isReachable
                                  ? entry.cost > 30 ? 'text-red-400' : 'text-dark-200'
                                  : 'text-dark-600'
                              }`}>
                                {isReachable ? `${entry.cost} dB` : '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
