import React, { useState, useEffect } from 'react';
import { Card, Table, Progress, Typography, Tag, Button, Space, List, Collapse, Row, Col } from 'antd';
import { TrophyOutlined, WarningOutlined, CheckCircleOutlined, ReloadOutlined, PlayCircleOutlined, PauseCircleOutlined, StepForwardOutlined } from '@ant-design/icons';
import type { SimulationResult, NodeRiskResult, GraphNode, GraphLink, SupplyNode } from '@/types';
import { useAppStore } from '@/store';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface ResultsPanelProps {
  result?: SimulationResult;
  nodes: SupplyNode[];
}

const getRiskLevel = (risk: number) => {
  if (risk >= 0.7) return { color: '#EF4444', level: '高风险' };
  if (risk >= 0.4) return { color: '#F59E0B', level: '中风险' };
  return { color: '#22C55E', level: '低风险' };
};

export const ResultsPanel: React.FC<ResultsPanelProps> = ({ result, nodes }) => {
  const {
    animationStep,
    maxAnimationSteps,
    isAnimationPlaying,
    setAnimationStep,
    setIsAnimationPlaying,
    setMaxAnimationSteps,
    graphNodes,
    graphLinks,
    simulationResult,
  } = useAppStore();

  const [animationInterval, setAnimationInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (result && simulationResult) {
      const maxStep = Math.max(
        ...Object.values(result.node_results).map(nr => nr.earliest_failure_step || 0),
        5
      );
      setMaxAnimationSteps(maxStep);
      setAnimationStep(0);
    }
  }, [result, simulationResult]);

  useEffect(() => {
    if (isAnimationPlaying) {
      const interval = setInterval(() => {
        setAnimationStep(prev => {
          if (prev >= maxAnimationSteps) {
            setIsAnimationPlaying(false);
            return maxAnimationSteps;
          }
          return prev + 1;
        });
      }, 800);
      setAnimationInterval(interval);
    } else if (animationInterval) {
      clearInterval(animationInterval);
      setAnimationInterval(null);
    }

    return () => {
      if (animationInterval) {
        clearInterval(animationInterval);
      }
    };
  }, [isAnimationPlaying, maxAnimationSteps]);

  const handlePlay = () => {
    if (animationStep >= maxAnimationSteps) {
      setAnimationStep(0);
    }
    setIsAnimationPlaying(true);
  };

  const handlePause = () => {
    setIsAnimationPlaying(false);
  };

  const handleStepForward = () => {
    setAnimationStep(prev => Math.min(prev + 1, maxAnimationSteps));
  };

  const handleReset = () => {
    setAnimationStep(0);
    setIsAnimationPlaying(false);
  };

  if (!result) {
    return (
      <Card size="small">
        <div className="text-center py-8">
          <CheckCircleOutlined style={{ fontSize: 48, color: '#10B981' }} />
          <Paragraph className="mt-4" type="secondary">
            暂无风险模拟结果
          </Paragraph>
          <Paragraph type="secondary">
            请在左侧面板选择中断节点并执行模拟
          </Paragraph>
        </div>
      </Card>
    );
  }

  const nodeResults = Object.entries(result.node_results).map(([nodeId, nr]) => ({
    key: nodeId,
    ...nr,
    nodeName: nodes.find(n => n.id === nodeId)?.name || nodeId,
  }));

  const sortedByRisk = [...nodeResults].sort((a, b) => b.risk_score - a.risk_score);

  const overallRiskLevel = getRiskLevel(result.overall_risk_score);

  const columns = [
    {
      title: '节点名称',
      dataIndex: 'nodeName',
      key: 'nodeName',
    },
    {
      title: '故障概率',
      dataIndex: 'failure_probability',
      key: 'failure_probability',
      render: (value: number) => (
        <Progress
          percent={Math.round(value * 100)}
          size="small"
          strokeColor={getRiskLevel(value).color}
        />
      ),
    },
    {
      title: '影响程度',
      dataIndex: 'impact_score',
      key: 'impact_score',
      render: (value: number) => (
        <Progress
          percent={Math.round(value * 100)}
          size="small"
          strokeColor="#3B82F6"
        />
      ),
    },
    {
      title: '风险评分',
      dataIndex: 'risk_score',
      key: 'risk_score',
      render: (value: number) => {
        const level = getRiskLevel(value);
        return (
          <Tag color={level.color}>
            {Math.round(value * 100)}%
          </Tag>
        );
      },
      sorter: (a: any, b: any) => a.risk_score - b.risk_score,
    },
    {
      title: '最早故障步骤',
      dataIndex: 'earliest_failure_step',
      key: 'earliest_failure_step',
      render: (value?: number) => value ?? 'N/A',
    },
  ];

  return (
    <div className="space-y-4">
      <Card size="small">
        <Row gutter={16}>
          <Col span={8}>
            <div className="text-center">
              <Text type="secondary">整体风险评分</Text>
              <div className="text-3xl font-bold mt-1" style={{ color: overallRiskLevel.color }}>
                {Math.round(result.overall_risk_score * 100)}%
              </div>
              <Tag color={overallRiskLevel.color}>{overallRiskLevel.level}</Tag>
            </div>
          </Col>
          <Col span={8}>
            <div className="text-center">
              <Text type="secondary">高风险节点</Text>
              <div className="text-3xl font-bold mt-1 text-red-500">
                {nodeResults.filter(n => n.risk_score >= 0.7).length}
              </div>
              <Tag color="red">需要关注</Tag>
            </div>
          </Col>
          <Col span={8}>
            <div className="text-center">
              <Text type="secondary">最脆弱节点</Text>
              <div className="text-base font-bold mt-1 truncate">
                {nodes.find(n => n.id === result.most_vulnerable_nodes[0])?.name || 'N/A'}
              </div>
              <Tag color="orange">最高风险</Tag>
            </div>
          </Col>
        </Row>
      </Card>

      <Card 
        size="small" 
        title={
          <Space>
            <PlayCircleOutlined />
            风险传播动画
          </Space>
        }
      >
        <div className="flex items-center justify-between">
          <Space>
            <Button
              icon={isAnimationPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={isAnimationPlaying ? handlePause : handlePlay}
            >
              {isAnimationPlaying ? '暂停' : '播放'}
            </Button>
            <Button icon={<StepForwardOutlined />} onClick={handleStepForward}>
              下一步
            </Button>
            <Button icon={<ReloadOutlined />} onClick={handleReset}>
              重置
            </Button>
          </Space>
          <Space>
            <Progress
              percent={maxAnimationSteps > 0 ? (animationStep / maxAnimationSteps) * 100 : 0}
              style={{ width: 200 }}
              showInfo={false}
            />
            <Text type="secondary">
              步骤: {animationStep} / {maxAnimationSteps}
            </Text>
          </Space>
        </div>
      </Card>

      <Card size="small" title={<Space><TrophyOutlined />关键风险路径</Space>}>
        <Collapse size="small">
          {result.critical_paths.map((path, index) => (
            <Panel 
              header={
                <Space>
                  <Tag color={index === 0 ? 'red' : 'orange'}>
                    路径 {index + 1}
                  </Tag>
                  <Text>
                    {path.map(nodeId => nodes.find(n => n.id === nodeId)?.name || nodeId).join(' → ')}
                  </Text>
                </Space>
              } 
              key={index}
            >
              <List
                size="small"
                dataSource={path}
                renderItem={(nodeId) => {
                  const nodeResult = result.node_results[nodeId];
                  const risk = nodeResult?.risk_score || 0;
                  const level = getRiskLevel(risk);
                  return (
                    <List.Item>
                      <Space>
                        <Tag color={level.color}>
                          {Math.round(risk * 100)}%
                        </Tag>
                        <Text>{nodes.find(n => n.id === nodeId)?.name || nodeId}</Text>
                      </Space>
                    </List.Item>
                  );
                }}
              />
            </Panel>
          ))}
        </Collapse>
      </Card>

      <Card size="small" title="节点风险详情">
        <Table
          columns={columns}
          dataSource={sortedByRisk}
          size="small"
          scroll={{ y: 300 }}
          pagination={{ pageSize: 10 }}
        />
      </Card>
    </div>
  );
};

export default ResultsPanel;
