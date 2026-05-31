import React from 'react';
import { Settings, Radio, Target, Network } from 'lucide-react';
import { useNetworkStore } from '../store/networkStore';
import { getNodeById } from '../utils/network';
import { RoutingTable } from './RoutingTable';

export const PropertiesPanel: React.FC = () => {
  const { nodes, edges, selectedNodeId, updateNode, simulationResult } = useNetworkStore();
  const selectedNode = selectedNodeId ? getNodeById(nodes, selectedNodeId) : null;

  const sourceNode = nodes.find(n => n.isSource);
  const targetNode = nodes.find(n => n.isTarget);

  return (
    <div className="w-72 bg-dark-900 border-l border-dark-700 p-4 flex flex-col gap-4 h-full overflow-y-auto scrollbar-thin">
      <div>
        <h2 className="text-lg font-bold text-white mb-1 text-shadow-glow flex items-center gap-2">
          <Settings size={20} />
          属性面板
        </h2>
        <p className="text-xs text-dark-400">查看和编辑节点属性</p>
      </div>

      <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
        <h3 className="text-sm font-semibold text-dark-200 mb-3 flex items-center gap-2">
          <Network size={16} />
          网络统计
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-dark-900 rounded p-2">
            <p className="text-xs text-dark-500">节点数量</p>
            <p className="text-xl font-mono font-bold text-accent-500">{nodes.length}</p>
          </div>
          <div className="bg-dark-900 rounded p-2">
            <p className="text-xs text-dark-500">连接数量</p>
            <p className="text-xl font-mono font-bold text-primary-500">{edges.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
        <h3 className="text-sm font-semibold text-green-400 mb-3 flex items-center gap-2">
          <Radio size={16} />
          源节点
        </h3>
        {sourceNode ? (
          <div className="bg-green-900/30 border border-green-700/50 rounded-lg p-3">
            <p className="text-sm font-medium text-green-300">{sourceNode.name}</p>
            <p className="text-xs text-green-500/70 mt-1">最大跳数: {sourceNode.maxHops}</p>
          </div>
        ) : (
          <p className="text-sm text-dark-500 italic">未设置</p>
        )}
      </div>

      <div className="bg-dark-800 rounded-lg p-4 border border-dark-700">
        <h3 className="text-sm font-semibold text-red-400 mb-3 flex items-center gap-2">
          <Target size={16} />
          目标节点
        </h3>
        {targetNode ? (
          <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-3">
            <p className="text-sm font-medium text-red-300">{targetNode.name}</p>
            <p className="text-xs text-red-500/70 mt-1">最大跳数: {targetNode.maxHops}</p>
          </div>
        ) : (
          <p className="text-sm text-dark-500 italic">未设置</p>
        )}
      </div>

      {selectedNode && (
        <div className="bg-dark-800 rounded-lg p-4 border border-accent-600/50">
          <h3 className="text-sm font-semibold text-accent-500 mb-4">选中节点属性</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-dark-400 mb-1">节点名称</label>
              <input
                type="text"
                value={selectedNode.name}
                onChange={(e) => updateNode(selectedNode.id, { name: e.target.value })}
                className="w-full bg-dark-900 border border-dark-600 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-accent-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs text-dark-400 mb-1">
                最大跳数限制: <span className="text-accent-500 font-mono">{selectedNode.maxHops}</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={selectedNode.maxHops}
                onChange={(e) => updateNode(selectedNode.id, { maxHops: parseInt(e.target.value) })}
                className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-accent-500"
              />
              <div className="flex justify-between text-xs text-dark-500 mt-1">
                <span>1</span>
                <span>10</span>
              </div>
            </div>

            <div>
              <label className="block text-xs text-dark-400 mb-1">
                信号覆盖范围: <span className="text-accent-500 font-mono">{selectedNode.signalRange}px</span>
              </label>
              <input
                type="range"
                min="50"
                max="300"
                step="10"
                value={selectedNode.signalRange}
                onChange={(e) => updateNode(selectedNode.id, { signalRange: parseInt(e.target.value) })}
                className="w-full h-2 bg-dark-700 rounded-lg appearance-none cursor-pointer accent-accent-500"
              />
              <div className="flex justify-between text-xs text-dark-500 mt-1">
                <span>50px</span>
                <span>300px</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="bg-dark-900 rounded p-2 text-center">
                <p className="text-xs text-dark-500">X 坐标</p>
                <p className="text-sm font-mono text-dark-200">{Math.round(selectedNode.x)}</p>
              </div>
              <div className="bg-dark-900 rounded p-2 text-center">
                <p className="text-xs text-dark-500">Y 坐标</p>
                <p className="text-sm font-mono text-dark-200">{Math.round(selectedNode.y)}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {simulationResult && (
        <div className={`rounded-lg p-4 border ${
          simulationResult.success 
            ? 'bg-green-900/20 border-green-700/50' 
            : 'bg-red-900/20 border-red-700/50'
        }`}>
          <h3 className={`text-sm font-semibold mb-3 ${
            simulationResult.success ? 'text-green-400' : 'text-red-400'
          }`}>
            模拟结果
          </h3>
          
          <div className="space-y-2">
            <p className={`text-sm ${simulationResult.success ? 'text-green-300' : 'text-red-300'}`}>
              {simulationResult.message}
            </p>
            
            {simulationResult.success && (
              <>
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-dark-500">跳数:</span>
                    <span className="text-accent-500 font-mono ml-1">{simulationResult.hops}</span>
                  </div>
                  <div>
                    <span className="text-dark-500">总衰减:</span>
                    <span className="text-accent-500 font-mono ml-1">{simulationResult.totalAttenuation} dB</span>
                  </div>
                </div>
                
                <div className="mt-3">
                  <p className="text-xs text-dark-400 mb-2">路径:</p>
                  <div className="flex flex-wrap items-center gap-1">
                    {simulationResult.path.map((nodeId, index) => {
                      const node = getNodeById(nodes, nodeId);
                      return (
                        <React.Fragment key={nodeId}>
                          <span className="bg-dark-900 text-xs px-2 py-1 rounded text-accent-400">
                            {node?.name || nodeId}
                          </span>
                          {index < simulationResult.path.length - 1 && (
                            <span className="text-dark-500">→</span>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <RoutingTable />

      <div className="mt-auto bg-dark-800 rounded-lg p-3 border border-dark-700">
        <h4 className="text-xs font-semibold text-dark-300 mb-2">操作提示</h4>
        <ul className="text-xs text-dark-500 space-y-1">
          <li>• 点击添加节点后在画布点击创建</li>
          <li>• 连接模式需依次点击两个节点</li>
          <li>• 删除模式可点击节点或连线删除</li>
          <li>• 右键可取消当前连线操作</li>
          <li>• 选择模式下可拖拽移动节点</li>
        </ul>
      </div>
    </div>
  );
};
