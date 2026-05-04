import React from 'react';
import { Button, Tooltip, Space, Divider, Popconfirm, message } from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  ExperimentOutlined,
  ClearOutlined,
  SaveOutlined
} from '@ant-design/icons';
import useAppStore from '../store/appStore';
import { simulationApi } from '../services/api';

function Toolbar() {
  const {
    mode,
    setMode,
    network,
    trafficLights,
    trafficFlows,
    clearNetwork,
    addSimulation,
    setCurrentSimulation
  } = useAppStore();

  const handleCreateSimulation = async () => {
    if (network.nodes.length === 0) {
      message.warning('请先创建道路网络');
      return;
    }

    if (network.edges.length === 0) {
      message.warning('请先创建道路连接');
      return;
    }

    try {
      const config = {
        network,
        trafficLights,
        trafficFlows,
        simulationConfig: {
          duration: 3600,
          timeStep: 1,
          snapshotInterval: 1
        }
      };

      const result = await simulationApi.create(config);
      message.success(`仿真任务已创建: ${result.simulationId}`);
      
      addSimulation({
        id: result.simulationId,
        status: result.status,
        createdAt: new Date().toISOString(),
        network: {
          nodeCount: network.nodes.length,
          edgeCount: network.edges.length
        }
      });
      
      setCurrentSimulation(result.simulationId);
      setMode('view');
    } catch (error) {
      message.error(`创建仿真任务失败: ${error.message}`);
    }
  };

  const handleClearNetwork = () => {
    clearNetwork();
    message.info('已清空道路网络');
  };

  return (
    <div className="toolbar">
      <Space direction="vertical" size="small">
        <Tooltip title="绘制模式">
          <Button
            type={mode === 'drawing' ? 'primary' : 'default'}
            icon={<EditOutlined />}
            onClick={() => setMode(mode === 'drawing' ? 'view' : 'drawing')}
            className="toolbar-btn"
          >
            绘制
          </Button>
        </Tooltip>

        <Tooltip title="查看模式">
          <Button
            type={mode === 'view' ? 'primary' : 'default'}
            icon={<EyeOutlined />}
            onClick={() => setMode('view')}
            className="toolbar-btn"
          >
            查看
          </Button>
        </Tooltip>

        <Divider style={{ margin: '8px 0' }} />

        <Tooltip title="保存并创建仿真任务">
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleCreateSimulation}
            className="toolbar-btn"
          >
            创建仿真
          </Button>
        </Tooltip>

        <Tooltip title="清空网络">
          <Popconfirm
            title="确定要清空整个道路网络吗？"
            description="此操作不可撤销"
            onConfirm={handleClearNetwork}
            okText="确定"
            cancelText="取消"
          >
            <Button
              danger
              icon={<ClearOutlined />}
              className="toolbar-btn"
            >
              清空
            </Button>
          </Popconfirm>
        </Tooltip>
      </Space>
    </div>
  );
}

export default Toolbar;
