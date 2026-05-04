import React, { useEffect } from 'react';
import { Modal, Progress, Spin, Tag, Alert, Button, Space, Typography } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import useAppStore from '../store/appStore';
import websocketService, { PhaseDescriptions } from '../services/websocketService';
import { simulationApi } from '../services/api';

const { Text, Title } = Typography;

function SimulationProgress({ simulationId, onClose, visible }) {
  const { simulationProgress, setSimulationProgress, clearSimulationProgress, addAlert } = useAppStore();

  useEffect(() => {
    if (visible && simulationId) {
      clearSimulationProgress();
      
      setSimulationProgress({
        currentSimulationId: simulationId,
        progress: 0,
        progressPercentage: 0,
        isRunning: true
      });

      websocketService.connect();
      
      websocketService.subscribeToSimulation(simulationId, (progressData) => {
        setSimulationProgress({
          currentSimulationId: simulationId,
          phase: progressData.phase,
          phaseDescription: progressData.phaseDescription,
          progress: progressData.progress,
          progressPercentage: progressData.progressPercentage,
          currentTime: progressData.currentTime,
          totalTime: progressData.totalTime,
          isCompleted: progressData.completed || progressData.isCompleted,
          isFailed: progressData.failed || progressData.isFailed,
          error: progressData.error
        });

        if (progressData.completed || progressData.isCompleted) {
          addAlert({
            type: 'success',
            message: '仿真完成',
            description: `仿真任务 ${simulationId.slice(0, 8)}... 已完成`
          });
        }

        if (progressData.failed || progressData.isFailed) {
          addAlert({
            type: 'error',
            message: '仿真失败',
            description: progressData.error || '仿真任务执行失败'
          });
        }
      });

      simulationApi.getSimulationStatus(simulationId).then((result) => {
        if (result.progress) {
          setSimulationProgress({
            ...result.progress,
            currentSimulationId: simulationId
          });
        }
      }).catch((error) => {
        console.error('Failed to get simulation status:', error);
      });
    }

    return () => {
      if (simulationId) {
        websocketService.unsubscribeFromSimulation(simulationId);
      }
    };
  }, [visible, simulationId, setSimulationProgress, clearSimulationProgress, addAlert]);

  const getStatusIcon = () => {
    if (simulationProgress.isCompleted) {
      return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 24 }} />;
    }
    if (simulationProgress.isFailed) {
      return <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 24 }} />;
    }
    return <LoadingOutlined style={{ color: '#1890ff', fontSize: 24 }} />;
  };

  const getStatusText = () => {
    if (simulationProgress.isCompleted) return '仿真完成';
    if (simulationProgress.isFailed) return '仿真失败';
    return '仿真进行中';
  };

  const getStatusColor = () => {
    if (simulationProgress.isCompleted) return 'success';
    if (simulationProgress.isFailed) return 'error';
    return 'processing';
  };

  const getPhaseDescription = () => {
    if (simulationProgress.phaseDescription) {
      return simulationProgress.phaseDescription;
    }
    if (simulationProgress.phase && PhaseDescriptions[simulationProgress.phase]) {
      return PhaseDescriptions[simulationProgress.phase];
    }
    return '准备中...';
  };

  const formatTime = (seconds) => {
    if (seconds === null || seconds === undefined) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal
      title={
        <Space>
          {getStatusIcon()}
          <span>{getStatusText()}</span>
          <Tag color={getStatusColor()}>{simulationProgress.progressPercentage}%</Tag>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={
        <Button onClick={onClose}>
          关闭
        </Button>
      }
      width={500}
      closable={!simulationProgress.isRunning}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Progress 
          percent={simulationProgress.progressPercentage}
          status={simulationProgress.isFailed ? 'exception' : simulationProgress.isCompleted ? 'success' : 'active'}
          strokeColor={simulationProgress.isFailed ? '#ff4d4f' : '#1890ff'}
          strokeWidth={12}
        />

        <div style={{ background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <Text type="secondary">当前阶段</Text>
              <div style={{ marginTop: 4 }}>
                <Tag color="blue">{getPhaseDescription()}</Tag>
              </div>
            </div>

            {simulationProgress.currentTime !== null && simulationProgress.totalTime !== null && (
              <div>
                <Text type="secondary">仿真进度</Text>
                <div style={{ marginTop: 4 }}>
                  <Text strong>
                    {formatTime(simulationProgress.currentTime)} / {formatTime(simulationProgress.totalTime)}
                  </Text>
                </div>
              </div>
            )}

            <div>
              <Text type="secondary">仿真ID</Text>
              <div style={{ marginTop: 4 }}>
                <Text code>{simulationProgress.currentSimulationId || simulationId}</Text>
              </div>
            </div>
          </Space>
        </div>

        {simulationProgress.isFailed && (
          <Alert
            message="仿真失败"
            description={simulationProgress.error || '未知错误'}
            type="error"
            showIcon
          />
        )}

        {simulationProgress.isCompleted && (
          <Alert
            message="仿真完成"
            description="仿真任务已成功完成，您可以关闭此对话框并查看仿真结果。"
            type="success"
            showIcon
          />
        )}

        <Text type="secondary" italic style={{ fontSize: 12 }}>
          提示：您可以关闭此对话框，进度会在后台继续更新。
        </Text>
      </Space>
    </Modal>
  );
}

export default SimulationProgress;
