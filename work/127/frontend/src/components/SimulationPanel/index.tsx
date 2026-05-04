import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, Button, Select, InputNumber, Space, Tag, message, List, Typography, Divider, Progress, Modal } from 'antd';
import { 
  ThunderboltOutlined, 
  HistoryOutlined, 
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import { useAppStore } from '@/store';
import { simulationApi, networkApi } from '@/api';
import type { TaskStatus, SimulationResult, SupplyNode, CreateSimulationData } from '@/api';

const { Title, Text, Paragraph } = Typography;

const POLL_INTERVAL = 2000;

interface SimulationPanelProps {
  networkId: string;
  nodes: SupplyNode[];
  onSimulationComplete: (result: SimulationResult) => void;
}

export const SimulationPanel: React.FC<SimulationPanelProps> = ({
  networkId,
  nodes,
  onSimulationComplete,
}) => {
  const {
    disruptedNodes,
    toggleDisruptedNode,
    clearDisruptedNodes,
    setIsSimulating,
    isSimulating,
    setCurrentSimulation,
    setSimulationResult,
  } = useAppStore();

  const [iterations, setIterations] = useState(1000);
  const [maxDepth, setMaxDepth] = useState(5);
  const [simulationName, setSimulationName] = useState(`风险模拟_${new Date().toLocaleDateString()}`);
  const [simulations, setSimulations] = useState<any[]>([]);
  const [loadingSimulations, setLoadingSimulations] = useState(false);
  
  const [currentTask, setCurrentTask] = useState<TaskStatus | null>(null);
  const [pollingTimer, setPollingTimer] = useState<NodeJS.Timeout | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const nodeOptions = nodes.map((node) => ({
    value: node.id,
    label: `${node.name} (${node.node_type})`,
  }));

  useEffect(() => {
    loadSimulations();
    
    return () => {
      if (pollingTimer) {
        clearInterval(pollingTimer);
      }
    };
  }, [networkId]);

  useEffect(() => {
    return () => {
      if (pollingTimer) {
        clearInterval(pollingTimer);
        setPollingTimer(null);
      }
    };
  }, [pollingTimer]);

  const loadSimulations = async () => {
    if (!networkId) return;
    setLoadingSimulations(true);
    try {
      const data = await simulationApi.getAll(networkId);
      setSimulations(data);
    } catch (error) {
      console.error('Failed to load simulations:', error);
    } finally {
      setLoadingSimulations(false);
    }
  };

  const pollTaskStatus = useCallback(async (taskId: string) => {
    try {
      const status = await simulationApi.getTaskStatus(taskId);
      setCurrentTask(status);
      
      if (status.status === 'completed' || status.status === 'failed' || status.status === 'cancelled') {
        if (pollingTimer) {
          clearInterval(pollingTimer);
          setPollingTimer(null);
        }
        setIsSimulating(false);
        
        if (status.status === 'completed') {
          if (status.has_result) {
            try {
              const result = await simulationApi.getResult(status.simulation_id);
              setSimulationResult(result);
              onSimulationComplete(result);
              message.success('模拟完成！');
              loadSimulations();
            } catch (error) {
              message.error('获取模拟结果失败');
            }
          }
        } else if (status.status === 'failed') {
          message.error(`模拟失败: ${status.error || '未知错误'}`);
        } else if (status.status === 'cancelled') {
          message.info('模拟已取消');
        }
      }
    } catch (error) {
      console.error('Failed to poll task status:', error);
    }
  }, [pollingTimer, onSimulationComplete]);

  const startPolling = (taskId: string) => {
    if (pollingTimer) {
      clearInterval(pollingTimer);
    }
    
    const timer = setInterval(() => {
      pollTaskStatus(taskId);
    }, POLL_INTERVAL);
    
    setPollingTimer(timer);
    
    pollTaskStatus(taskId);
  };

  const handleRunSimulationAsync = async () => {
    if (disruptedNodes.size === 0) {
      message.warning('请至少选择一个中断节点');
      return;
    }

    setIsSimulating(true);
    
    try {
      const simulationData: CreateSimulationData = {
        network_id: networkId,
        name: simulationName,
        disrupted_node_ids: Array.from(disruptedNodes),
        iterations,
        max_propagation_depth: maxDepth,
      };

      const simulation = await simulationApi.create(simulationData);
      setCurrentSimulation(simulation);

      message.info('正在启动模拟任务...');
      
      const taskStatus = await simulationApi.runAsync(simulation.id);
      setCurrentTask(taskStatus);
      
      message.info('模拟任务已提交到后台执行');
      
      startPolling(taskStatus.task_id);
      
    } catch (error: any) {
      setIsSimulating(false);
      message.error(error.response?.data?.detail || '启动模拟失败');
    }
  };

  const handleCancelTask = async () => {
    if (!currentTask) return;
    
    try {
      await simulationApi.cancelTask(currentTask.task_id);
      setShowCancelConfirm(false);
      
      if (pollingTimer) {
        clearInterval(pollingTimer);
        setPollingTimer(null);
      }
      
      setIsSimulating(false);
      setCurrentTask(null);
      message.info('已发送取消请求');
      
    } catch (error) {
      message.error('取消任务失败');
    }
  };

  const handleLoadSimulation = async (simulationId: string) => {
    try {
      const result = await simulationApi.getResult(simulationId);
      setSimulationResult(result);
      onSimulationComplete(result);
      
      const simulation = await simulationApi.getById(simulationId);
      setCurrentSimulation(simulation);
      
      message.success('已加载历史模拟结果');
    } catch (error) {
      message.error('加载模拟结果失败');
    }
  };

  const getNodeName = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    return node ? node.name : nodeId;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'default';
      case 'running': return 'processing';
      case 'completed': return 'success';
      case 'failed': return 'error';
      case 'cancelled': return 'warning';
      default: return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '等待中';
      case 'running': return '运行中';
      case 'completed': return '已完成';
      case 'failed': return '失败';
      case 'cancelled': return '已取消';
      default: return status;
    }
  };

  return (
    <div className="space-y-4">
      <Card size="small" title={<Space><ThunderboltOutlined />新建风险模拟</Space>}>
        <div className="space-y-4">
          <div>
            <Text strong>模拟名称</Text>
            <Select
              value={simulationName}
              onChange={(value) => setSimulationName(String(value))}
              style={{ width: '100%', marginTop: 8 }}
              allowClear
              showSearch
              placeholder="输入模拟名称"
            />
          </div>

          <div>
            <Text strong>选择中断节点</Text>
            <Select
              mode="multiple"
              style={{ width: '100%', marginTop: 8 }}
              placeholder="选择发生故障的节点"
              value={Array.from(disruptedNodes)}
              onChange={(values) => {
                clearDisruptedNodes();
                values.forEach(v => toggleDisruptedNode(v));
              }}
              options={nodeOptions}
              maxTagCount={3}
              disabled={isSimulating}
            />
          </div>

          {disruptedNodes.size > 0 && (
            <div className="flex flex-wrap gap-1">
              {Array.from(disruptedNodes).map(nodeId => (
                <Tag
                  key={nodeId}
                  color="red"
                  closable={!isSimulating}
                  onClose={() => !isSimulating && toggleDisruptedNode(nodeId)}
                >
                  {getNodeName(nodeId)}
                </Tag>
              ))}
            </div>
          )}

          <Space>
            <div>
              <Text strong>蒙特卡洛迭代次数</Text>
              <InputNumber
                min={100}
                max={10000}
                step={100}
                value={iterations}
                onChange={setIterations}
                style={{ width: 120, marginTop: 4 }}
                disabled={isSimulating}
              />
            </div>
            <div>
              <Text strong>最大传播深度</Text>
              <InputNumber
                min={1}
                max={20}
                value={maxDepth}
                onChange={setMaxDepth}
                style={{ width: 120, marginTop: 4 }}
                disabled={isSimulating}
              />
            </div>
          </Space>

          {currentTask && currentTask.status === 'running' && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Space>
                  <ThunderboltOutlined spin />
                  <Text strong>{getStatusText(currentTask.status)}</Text>
                </Space>
                <Button
                  danger
                  size="small"
                  icon={<StopOutlined />}
                  onClick={() => setShowCancelConfirm(true)}
                >
                  取消
                </Button>
              </div>
              <Progress
                percent={Math.round(currentTask.progress.percentage)}
                status="active"
                format={(percent) => `${currentTask.progress.current} / ${currentTask.progress.total}`}
              />
              {currentTask.progress.message && (
                <Text type="secondary" className="text-sm block mt-2">
                  {currentTask.progress.message}
                </Text>
              )}
            </div>
          )}

          {currentTask && currentTask.status === 'completed' && (
            <div className="p-4 bg-green-50 rounded-lg">
              <Space>
                <HistoryOutlined />
                <Text strong type="success">
                  模拟完成 - {new Date(currentTask.completed_at || '').toLocaleString()}
                </Text>
              </Space>
              <Button 
                type="link" 
                size="small" 
                icon={<ReloadOutlined />}
                onClick={() => {
                  setCurrentTask(null);
                  clearDisruptedNodes();
                }}
              >
                新建模拟
              </Button>
            </div>
          )}

          {(!isSimulating || (currentTask && currentTask.status !== 'running')) && (
            <Button
              type="primary"
              block
              icon={<PlayCircleOutlined />}
              onClick={handleRunSimulationAsync}
              loading={isSimulating && currentTask?.status === 'running'}
              disabled={disruptedNodes.size === 0 || (currentTask?.status === 'running')}
            >
              {currentTask?.status === 'running' 
                ? '模拟执行中...' 
                : currentTask?.status === 'completed'
                  ? '再次执行'
                  : '执行风险模拟'
              }
            </Button>
          )}

          <Text type="secondary" className="text-sm block">
            提示：大规模网络（>1000节点）模拟会在后台执行，您可以在此查看进度
          </Text>
        </div>
      </Card>

      <Card 
        size="small" 
        title={<Space><HistoryOutlined />历史模拟</Space>}
        loading={loadingSimulations}
      >
        {simulations.length === 0 ? (
          <Text type="secondary">暂无历史模拟记录</Text>
        ) : (
          <List
            size="small"
            dataSource={simulations.slice(0, 5)}
            renderItem={(sim) => (
              <List.Item
                actions={[
                  <Button
                    key="load"
                    type="link"
                    size="small"
                    onClick={() => handleLoadSimulation(sim.id)}
                    disabled={sim.status === 'running' || sim.status === 'pending'}
                  >
                    查看
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={sim.name}
                  description={
                    <Space size="small">
                      <Tag color={getStatusColor(sim.status)}>
                        {getStatusText(sim.status)}
                      </Tag>
                      <Text type="secondary">
                        {new Date(sim.created_at).toLocaleString()}
                      </Text>
                      {sim.disrupted_node_ids?.length > 0 && (
                        <Tag>
                          {sim.disrupted_node_ids.length} 个中断节点
                        </Tag>
                      )}
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Modal
        title="确认取消模拟"
        open={showCancelConfirm}
        onOk={handleCancelTask}
        onCancel={() => setShowCancelConfirm(false)}
        okText="确认取消"
        cancelText="继续执行"
        okButtonProps={{ danger: true }}
      >
        <Paragraph>
          确定要取消当前的模拟任务吗？
        </Paragraph>
        <Paragraph type="secondary">
          取消后，已计算的进度将丢失，需要重新开始。
        </Paragraph>
      </Modal>
    </div>
  );
};

export default SimulationPanel;
