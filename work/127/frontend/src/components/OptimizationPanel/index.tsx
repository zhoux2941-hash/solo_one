import React, { useState, useEffect, useCallback } from 'react';
import {
  Card,
  Button,
  Select,
  InputNumber,
  Space,
  Tag,
  message,
  List,
  Typography,
  Divider,
  Row,
  Col,
  Statistic,
  Progress,
  Collapse,
  Checkbox,
  Empty,
  Spin,
  Tooltip,
  Popconfirm
} from 'antd';
import {
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  RocketOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  LineChartOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type {
  OptimizationSuggestion,
  OptimizationResult,
  SimulatedOptimizationResult
} from '@/api';
import { optimizationApi } from '@/api';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;

interface OptimizationPanelProps {
  networkId: string;
  onCompareClick: (selectedSuggestions: number[]) => void;
  simulationResult?: SimulatedOptimizationResult | null;
}

const SUGGESTION_TYPE_INFO: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  single_source_risk: {
    label: '单一供应商风险',
    color: 'red',
    icon: <WarningOutlined />
  },
  high_betweenness: {
    label: '关键瓶颈节点',
    color: 'orange',
    icon: <ThunderboltOutlined />
  },
  high_risk_node: {
    label: '高风险节点',
    color: 'warning',
    icon: <SafetyCertificateOutlined />
  },
  high_risk_dependency: {
    label: '高风险依赖关系',
    color: 'magenta',
    icon: <LineChartOutlined />
  },
  no_supplier: {
    label: '无上游供应商',
    color: 'red',
    icon: <WarningOutlined />
  }
};

const ACTION_TYPE_INFO: Record<string, { label: string; color: string }> = {
  add_alternative_supplier: {
    label: '添加备选供应商',
    color: 'blue'
  },
  add_supplier: {
    label: '添加上游供应商',
    color: 'cyan'
  },
  add_parallel_path: {
    label: '添加平行路径',
    color: 'purple'
  },
  reduce_risk: {
    label: '降低节点风险',
    color: 'green'
  },
  diversify_dependency: {
    label: '分散依赖关系',
    color: 'gold'
  }
};

export const OptimizationPanel: React.FC<OptimizationPanelProps> = ({
  networkId,
  onCompareClick,
  simulationResult
}) => {
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [maxSuggestions, setMaxSuggestions] = useState(10);
  const [budgetLimit, setBudgetLimit] = useState<number | undefined>(undefined);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());
  const [showComparison, setShowComparison] = useState(false);

  const loadSuggestions = useCallback(async () => {
    if (!networkId) return;
    
    setLoading(true);
    try {
      const result = await optimizationApi.getSuggestions(
        networkId,
        maxSuggestions,
        budgetLimit
      );
      setOptimizationResult(result);
      setSelectedSuggestions(new Set());
    } catch (error: any) {
      message.error(error.response?.data?.detail || '加载优化建议失败');
    } finally {
      setLoading(false);
    }
  }, [networkId, maxSuggestions, budgetLimit]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  const handleSelectSuggestion = (index: number, checked: boolean) => {
    const newSelected = new Set(selectedSuggestions);
    if (checked) {
      newSelected.add(index);
    } else {
      newSelected.delete(index);
    }
    setSelectedSuggestions(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && optimizationResult) {
      setSelectedSuggestions(new Set(optimizationResult.suggestions.map((_, i) => i)));
    } else {
      setSelectedSuggestions(new Set());
    }
  };

  const handleSimulateOptimization = async () => {
    if (selectedSuggestions.size === 0) {
      message.warning('请至少选择一个优化建议');
      return;
    }

    setSimulating(true);
    try {
      const result = await optimizationApi.simulateOptimization(
        networkId,
        Array.from(selectedSuggestions)
      );
      onCompareClick(Array.from(selectedSuggestions));
      setShowComparison(true);
      message.success('优化模拟完成！');
    } catch (error: any) {
      message.error(error.response?.data?.detail || '模拟优化失败');
    } finally {
      setSimulating(false);
    }
  };

  const getSuggestionTypeTag = (type: string) => {
    const info = SUGGESTION_TYPE_INFO[type];
    if (!info) return <Tag>{type}</Tag>;
    return (
      <Tag color={info.color} icon={info.icon}>
        {info.label}
      </Tag>
    );
  };

  const getActionTag = (action: string) => {
    const info = ACTION_TYPE_INFO[action];
    if (!info) return <Tag>{action}</Tag>;
    return <Tag color={info.color}>{info.label}</Tag>;
  };

  const formatCost = (cost: number) => {
    if (cost >= 1000000) {
      return `¥${(cost / 1000000).toFixed(1)}M`;
    } else if (cost >= 1000) {
      return `¥${(cost / 1000).toFixed(1)}K`;
    }
    return `¥${cost.toFixed(0)}`;
  };

  const getRiskColor = (risk: number) => {
    if (risk >= 0.5) return 'red';
    if (risk >= 0.3) return 'orange';
    return 'green';
  };

  const getCostEffectivenessColor = (ratio: number) => {
    if (ratio >= 0.0001) return 'green';
    if (ratio >= 0.00005) return 'orange';
    return 'default';
  };

  if (!networkId) {
    return (
      <Card size="small">
        <Empty description="请先选择一个供应链网络" />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card 
        size="small" 
        title={
          <Space>
            <RocketOutlined />
            <span>供应商优化建议</span>
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined />}
              onClick={loadSuggestions}
              loading={loading}
            >
              刷新
            </Button>
          </Space>
        }
      >
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Text strong>最大建议数量</Text>
              <InputNumber
                min={1}
                max={50}
                value={maxSuggestions}
                onChange={setMaxSuggestions}
                style={{ width: '100%', marginTop: 4 }}
              />
            </Col>
            <Col span={8}>
              <Text strong>预算限制 (¥)</Text>
              <InputNumber
                min={0}
                value={budgetLimit}
                onChange={setBudgetLimit}
                style={{ width: '100%', marginTop: 4 }}
                placeholder="不限制"
              />
            </Col>
            <Col span={8} style={{ display: 'flex', alignItems: 'flex-end' }}>
              <Button
                type="primary"
                onClick={loadSuggestions}
                loading={loading}
                block
              >
                应用筛选
              </Button>
            </Col>
          </Row>
        </div>

        {optimizationResult && optimizationResult.summary && (
          <Row gutter={[16, 16]} className="mb-4">
            <Col span={6}>
              <Card size="small" bordered={false} className="text-center">
                <Statistic
                  title="优化建议数"
                  value={optimizationResult.summary.total_suggestions}
                  prefix={<ThunderboltOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" bordered={false} className="text-center">
                <Statistic
                  title="预计风险降低"
                  value={optimizationResult.summary.estimated_total_risk_reduction * 100}
                  suffix="%"
                  prefix={<SafetyCertificateOutlined />}
                  valueStyle={{ color: '#3f8600' }}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" bordered={false} className="text-center">
                <Statistic
                  title="预计总成本"
                  value={optimizationResult.summary.estimated_total_cost}
                  prefix={<DollarOutlined />}
                  formatter={(value) => formatCost(Number(value))}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card size="small" bordered={false} className="text-center">
                <Statistic
                  title="已选择"
                  value={selectedSuggestions.size}
                  suffix={`/ ${optimizationResult.summary.total_suggestions}`}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
          </Row>
        )}

        {loading ? (
          <div className="text-center py-8">
            <Spin size="large" />
            <div className="mt-4">
              <Text type="secondary">正在分析网络结构和风险点...</Text>
            </div>
          </div>
        ) : !optimizationResult || optimizationResult.suggestions.length === 0 ? (
          <Empty description="暂无优化建议，网络结构可能已经很健壮！" />
        ) : (
          <>
            <div className="mb-4 flex justify-between items-center">
              <Space>
                <Checkbox
                  indeterminate={selectedSuggestions.size > 0 && selectedSuggestions.size < optimizationResult.suggestions.length}
                  checked={selectedSuggestions.size === optimizationResult.suggestions.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                >
                  全选
                </Checkbox>
                <Text type="secondary">
                  已选择 {selectedSuggestions.size} 个建议
                </Text>
              </Space>
              <Space>
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  onClick={handleSimulateOptimization}
                  loading={simulating}
                  disabled={selectedSuggestions.size === 0}
                >
                  模拟优化效果
                </Button>
              </Space>
            </div>

            <Collapse defaultActiveKey={['0']}>
              {optimizationResult.suggestions.map((suggestion, index) => (
                <Panel
                  key={index}
                  header={
                    <Space wrap style={{ width: '100%' }}>
                      <Checkbox
                        checked={selectedSuggestions.has(index)}
                        onChange={(e) => handleSelectSuggestion(index, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Text strong>{suggestion.target_node_name}</Text>
                      {getSuggestionTypeTag(suggestion.suggestion_type)}
                      {getActionTag(suggestion.suggested_action)}
                      <Tag color={getRiskColor(suggestion.risk_reduction_estimate)}>
                        风险降低: {Math.round(suggestion.risk_reduction_estimate * 100)}%
                      </Tag>
                      <Tag>
                        成本: {formatCost(suggestion.cost_estimate)}
                      </Tag>
                      <Tag color={getCostEffectivenessColor(suggestion.cost_effectiveness)}>
                        成本效益比: {(suggestion.cost_effectiveness * 1000000).toFixed(2)}
                      </Tag>
                    </Space>
                  }
                >
                  <div className="pl-6">
                    <Paragraph className="mb-4">
                      <Text strong>问题描述: </Text>
                      {suggestion.description}
                    </Paragraph>

                    <Row gutter={[24, 16]}>
                      <Col span={12}>
                        <div className="p-3 bg-blue-50 rounded-lg">
                          <Text strong className="block mb-2">风险分析</Text>
                          <div className="mb-2">
                            <Text type="secondary">预计风险降低: </Text>
                            <Progress
                              percent={Math.round(suggestion.risk_reduction_estimate * 100)}
                              size="small"
                              status="active"
                              strokeColor={getRiskColor(suggestion.risk_reduction_estimate)}
                            />
                          </div>
                        </div>
                      </Col>
                      <Col span={12}>
                        <div className="p-3 bg-green-50 rounded-lg">
                          <Text strong className="block mb-2">成本分析</Text>
                          <Row gutter={16}>
                            <Col span={12}>
                              <Text type="secondary">预计成本:</Text>
                              <div className="text-xl font-bold text-green-600">
                                {formatCost(suggestion.cost_estimate)}
                              </div>
                            </Col>
                            <Col span={12}>
                              <Text type="secondary">成本效益比:</Text>
                              <div className="text-xl font-bold">
                                <Tag color={getCostEffectivenessColor(suggestion.cost_effectiveness)}>
                                  {(suggestion.cost_effectiveness * 1000000).toFixed(2)}
                                </Tag>
                              </div>
                            </Col>
                          </Row>
                        </div>
                      </Col>
                    </Row>

                    {Object.keys(suggestion.details).length > 0 && (
                      <div className="mt-4">
                        <Text strong>详细信息:</Text>
                        <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                          <Row gutter={[16, 8]}>
                            {suggestion.details.current_supplier && (
                              <Col span={8}>
                                <Text type="secondary">当前供应商: </Text>
                                <Tag>{suggestion.details.current_supplier}</Tag>
                              </Col>
                            )}
                            {suggestion.details.dependency_strength !== undefined && (
                              <Col span={8}>
                                <Text type="secondary">依赖强度: </Text>
                                <Tag color={suggestion.details.dependency_strength > 0.7 ? 'red' : 'orange'}>
                                  {Math.round(suggestion.details.dependency_strength * 100)}%
                                </Tag>
                              </Col>
                            )}
                            {suggestion.details.impact_score !== undefined && (
                              <Col span={8}>
                                <Text type="secondary">影响评分: </Text>
                                <Tag>{(suggestion.details.impact_score * 100).toFixed(1)}%</Tag>
                              </Col>
                            )}
                            {suggestion.details.betweenness_centrality !== undefined && (
                              <Col span={8}>
                                <Text type="secondary">介数中心性: </Text>
                                <Tag color={suggestion.details.betweenness_centrality > 0.3 ? 'orange' : 'default'}>
                                  {(suggestion.details.betweenness_centrality * 100).toFixed(1)}%
                                </Tag>
                              </Col>
                            )}
                            {suggestion.details.downstream_nodes !== undefined && (
                              <Col span={8}>
                                <Text type="secondary">下游节点数: </Text>
                                <Tag>{suggestion.details.downstream_nodes} 个</Tag>
                              </Col>
                            )}
                            {suggestion.details.suggested_approach && (
                              <Col span={24}>
                                <Text type="secondary">建议方案: </Text>
                                <Text>{suggestion.details.suggested_approach}</Text>
                              </Col>
                            )}
                          </Row>
                        </div>
                      </div>
                    )}
                  </div>
                </Panel>
              ))}
            </Collapse>
          </>
        )}
      </Card>

      {simulationResult && (
        <Card
          size="small"
          title={
            <Space>
              <LineChartOutlined />
              <span>优化效果对比</span>
            </Space>
          }
        >
          <Row gutter={[24, 24]}>
            <Col span={12}>
              <Card 
                size="small" 
                title={
                  <Space>
                    <WarningOutlined style={{ color: '#faad14' }} />
                    <span>优化前</span>
                  </Space>
                }
                className="h-full"
              >
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Statistic
                      title="节点数量"
                      value={simulationResult.comparison.original_network.node_count}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="依赖关系"
                      value={simulationResult.comparison.original_network.link_count}
                    />
                  </Col>
                  <Col span={24}>
                    <div className="mt-4">
                      <Text type="secondary" className="block mb-2">
                        总体风险评分
                      </Text>
                      <Progress
                        percent={Math.round(simulationResult.comparison.original_network.estimated_aggregate_risk * 100)}
                        strokeColor="#faad14"
                        size="large"
                      />
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
            <Col span={12}>
              <Card 
                size="small" 
                title={
                  <Space>
                    <SafetyCertificateOutlined style={{ color: '#52c41a' }} />
                    <span>优化后</span>
                  </Space>
                }
                className="h-full"
              >
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Statistic
                      title="节点数量"
                      value={simulationResult.comparison.optimized_network.node_count}
                      suffix={
                        <Tag color="green">
                          +{simulationResult.comparison.optimized_network.nodes_added}
                        </Tag>
                      }
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="依赖关系"
                      value={simulationResult.comparison.optimized_network.link_count}
                    />
                  </Col>
                  <Col span={24}>
                    <div className="mt-4">
                      <Text type="secondary" className="block mb-2">
                        总体风险评分
                      </Text>
                      <Progress
                        percent={Math.round(simulationResult.comparison.optimized_network.estimated_aggregate_risk * 100)}
                        strokeColor="#52c41a"
                        size="large"
                      />
                    </div>
                  </Col>
                </Row>
              </Card>
            </Col>
          </Row>

          <Divider />

          <Row gutter={[24, 16]}>
            <Col span={8}>
              <Card size="small" className="text-center" bordered={false}>
                <Statistic
                  title="风险降低百分比"
                  value={simulationResult.comparison.risk_analysis.risk_reduction_percentage}
                  suffix="%"
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<SafetyCertificateOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" className="text-center" bordered={false}>
                <Statistic
                  title="绝对风险降低"
                  value={simulationResult.comparison.risk_analysis.absolute_risk_reduction * 100}
                  suffix="%"
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<CheckCircleOutlined />}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card size="small" className="text-center" bordered={false}>
                <Statistic
                  title="应用建议数"
                  value={simulationResult.comparison.risk_analysis.suggestions_applied}
                  prefix={<RocketOutlined />}
                />
              </Card>
            </Col>
          </Row>

          {simulationResult.comparison.node_risk_comparison.length > 0 && (
            <div className="mt-4">
              <Text strong>节点风险变化:</Text>
              <List
                size="small"
                dataSource={simulationResult.comparison.node_risk_comparison.filter(
                  n => n.original_risk !== n.simulated_risk
                ).slice(0, 10)}
                renderItem={(item) => (
                  <List.Item>
                    <Space wrap>
                      <Text>{item.node_name}</Text>
                      <Tag>
                        原风险: {Math.round(item.original_risk * 100)}%
                      </Tag>
                      <Tag color="green">
                        优化后: {Math.round(item.simulated_risk * 100)}%
                      </Tag>
                      <Tag color={item.simulated_risk < item.original_risk ? 'green' : 'red'}>
                        {item.simulated_risk < item.original_risk ? '↓' : '↑'} 
                        {Math.abs(item.simulated_risk - item.original_risk) * 100}%
                      </Tag>
                    </Space>
                  </List.Item>
                )}
              />
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default OptimizationPanel;
