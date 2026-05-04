import React, { useState, useEffect, useRef } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Progress,
  Typography,
  Tag,
  Space,
  Button,
  Empty,
  Spin,
  Tabs,
  List,
  Divider
} from 'antd';
import {
  SafetyCertificateOutlined,
  WarningOutlined,
  ArrowDownOutlined,
  CheckCircleOutlined,
  SwapOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import type { SimulatedOptimizationResult } from '@/api';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

interface SplitCompareViewProps {
  result: SimulatedOptimizationResult | null;
  onReAnalyze?: () => void;
  loading?: boolean;
}

const RiskHeatMapCompare: React.FC<{ result: SimulatedOptimizationResult }> = ({ result }) => {
  const { comparison } = result;
  
  const getRiskColor = (risk: number) => {
    if (risk >= 0.7) return '#ff4d4f';
    if (risk >= 0.4) return '#faad14';
    return '#52c41a';
  };

  const getRiskLevel = (risk: number) => {
    if (risk >= 0.7) return '高风险';
    if (risk >= 0.4) return '中风险';
    return '低风险';
  };

  const nodeComparison = comparison.node_risk_comparison || [];
  
  const riskChangedNodes = nodeComparison.filter(
    n => Math.abs(n.original_risk - n.simulated_risk) > 0.01
  );

  const improvedNodes = riskChangedNodes.filter(n => n.simulated_risk < n.original_risk);
  const worsenedNodes = riskChangedNodes.filter(n => n.simulated_risk > n.original_risk);

  return (
    <div className="space-y-4">
      <Row gutter={[24, 24]}>
        <Col span={12}>
          <Card 
            size="small"
            title={
              <Space>
                <WarningOutlined style={{ color: '#faad14' }} />
                <span>优化前 - 风险热力分布</span>
              </Space>
            }
            className="h-full"
          >
            <div className="mb-4">
              <Statistic
                title="总体风险评分"
                value={comparison.original_network.estimated_aggregate_risk * 100}
                suffix="%"
                valueStyle={{ color: '#faad14' }}
              />
            </div>
            
            <div className="mb-4">
              <Text type="secondary" className="block mb-2">
                风险分布
              </Text>
              <Progress
                percent={Math.round(comparison.original_network.estimated_aggregate_risk * 100)}
                strokeColor={getRiskColor(comparison.original_network.estimated_aggregate_risk)}
                size="large"
                status="exception"
              />
              <div className="mt-2 text-center">
                <Tag color={getRiskColor(comparison.original_network.estimated_aggregate_risk)}>
                  {getRiskLevel(comparison.original_network.estimated_aggregate_risk)}
                </Tag>
              </div>
            </div>

            <div className="mt-4">
              <Text strong className="block mb-2">高风险节点 (Top 10)</Text>
              <List
                size="small"
                dataSource={[...nodeComparison]
                  .sort((a, b) => b.original_risk - a.original_risk)
                  .slice(0, 10)}
                renderItem={(item) => (
                  <List.Item>
                    <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Text>{item.node_name}</Text>
                      <Tag color={getRiskColor(item.original_risk)}>
                        {Math.round(item.original_risk * 100)}%
                      </Tag>
                    </Space>
                  </List.Item>
                )}
              />
            </div>
          </Card>
        </Col>

        <Col span={12}>
          <Card 
            size="small"
            title={
              <Space>
                <SafetyCertificateOutlined style={{ color: '#52c41a' }} />
                <span>优化后 - 风险热力分布</span>
              </Space>
            }
            className="h-full"
          >
            <div className="mb-4">
              <Statistic
                title="总体风险评分"
                value={comparison.optimized_network.estimated_aggregate_risk * 100}
                suffix="%"
                valueStyle={{ color: '#52c41a' }}
                prefix={<ArrowDownOutlined />}
              />
            </div>
            
            <div className="mb-4">
              <Text type="secondary" className="block mb-2">
                风险分布
              </Text>
              <Progress
                percent={Math.round(comparison.optimized_network.estimated_aggregate_risk * 100)}
                strokeColor={getRiskColor(comparison.optimized_network.estimated_aggregate_risk)}
                size="large"
                status="normal"
              />
              <div className="mt-2 text-center">
                <Tag color={getRiskColor(comparison.optimized_network.estimated_aggregate_risk)}>
                  {getRiskLevel(comparison.optimized_network.estimated_aggregate_risk)}
                </Tag>
              </div>
            </div>

            <div className="mt-4">
              <Text strong className="block mb-2">改善效果 (Top 10)</Text>
              <List
                size="small"
                dataSource={improvedNodes
                  .sort((a, b) => (b.original_risk - b.simulated_risk) - (a.original_risk - a.simulated_risk))
                  .slice(0, 10)}
                renderItem={(item) => (
                  <List.Item>
                    <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                      <Text>{item.node_name}</Text>
                      <Space>
                        <Tag>{Math.round(item.original_risk * 100)}%</Tag>
                        <Text>→</Text>
                        <Tag color="green">{Math.round(item.simulated_risk * 100)}%</Tag>
                        <Tag color="green">
                          ↓{Math.round((item.original_risk - item.simulated_risk) * 100)}%
                        </Tag>
                      </Space>
                    </Space>
                  </List.Item>
                )}
                locale={{ emptyText: '无显著改善的节点' }}
              />
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

const NetworkStructureCompare: React.FC<{ result: SimulatedOptimizationResult }> = ({ result }) => {
  const { comparison } = result;

  return (
    <div className="space-y-4">
      <Row gutter={[24, 24]}>
        <Col span={12}>
          <Card 
            size="small"
            title={
              <Space>
                <WarningOutlined style={{ color: '#faad14' }} />
                <span>优化前 - 网络结构</span>
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="节点数量"
                  value={comparison.original_network.node_count}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="依赖关系"
                  value={comparison.original_network.link_count}
                />
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
                <span>优化后 - 网络结构</span>
              </Space>
            }
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="节点数量"
                  value={comparison.optimized_network.node_count}
                  suffix={
                    comparison.optimized_network.nodes_added > 0 ? (
                      <Tag color="green">+{comparison.optimized_network.nodes_added}</Tag>
                    ) : null
                  }
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="依赖关系"
                  value={comparison.optimized_network.link_count}
                  suffix={
                    comparison.optimized_network.links_modified > 0 ? (
                      <Tag color="blue">修改 {comparison.optimized_network.links_modified}</Tag>
                    ) : null
                  }
                />
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      <Divider />

      <Card size="small" title="结构优化详情">
        <List
          size="small"
          dataSource={result.suggestions_applied}
          renderItem={(suggestion, index) => (
            <List.Item>
              <Space wrap style={{ width: '100%' }}>
                <Tag color="blue">{index + 1}</Tag>
                <Text strong>{suggestion.target_node_name}</Text>
                <Tag color="orange">{suggestion.suggested_action}</Tag>
                <Text type="secondary">{suggestion.description}</Text>
                <Tag color="green">
                  风险降低: {Math.round(suggestion.risk_reduction_estimate * 100)}%
                </Tag>
                <Tag>
                  成本: ¥{suggestion.cost_estimate.toLocaleString()}
                </Tag>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

const CostBenefitAnalysis: React.FC<{ result: SimulatedOptimizationResult }> = ({ result }) => {
  const { comparison, suggestions_applied } = result;
  
  const totalCost = suggestions_applied.reduce((sum, s) => sum + s.cost_estimate, 0);
  const totalRiskReduction = comparison.risk_analysis.risk_reduction_percentage;
  
  const costPerRiskReduction = totalRiskReduction > 0 ? totalCost / totalRiskReduction : 0;

  return (
    <div className="space-y-4">
      <Row gutter={[24, 24]}>
        <Col span={8}>
          <Card size="small" className="text-center">
            <Statistic
              title="应用建议数量"
              value={comparison.risk_analysis.suggestions_applied}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" className="text-center">
            <Statistic
              title="风险降低百分比"
              value={totalRiskReduction}
              suffix="%"
              valueStyle={{ color: '#3f8600' }}
              prefix={<SafetyCertificateOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" className="text-center">
            <Statistic
              title="绝对风险降低"
              value={comparison.risk_analysis.absolute_risk_reduction * 100}
              suffix="%"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      <Divider />

      <Row gutter={[24, 24]}>
        <Col span={12}>
          <Card 
            size="small"
            title="成本分析"
          >
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Statistic
                  title="总投入成本"
                  value={totalCost}
                  prefix="¥"
                  formatter={(value) => Number(value).toLocaleString()}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="每降低1%风险成本"
                  value={costPerRiskReduction}
                  prefix="¥"
                  formatter={(value) => Number(value).toLocaleString()}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col span={12}>
          <Card 
            size="small"
            title="投资回报率 (ROI)"
          >
            <div className="mb-4">
              <Text type="secondary" className="block mb-2">
                风险降低效率
              </Text>
              <Progress
                percent={Math.min(100, totalRiskReduction / (comparison.original_network.estimated_aggregate_risk * 100) * 100)}
                strokeColor="#52c41a"
                size="large"
              />
            </div>
            <Paragraph type="secondary">
              通过投入 ¥{totalCost.toLocaleString()}，成功将整体风险降低了 {totalRiskReduction}%。
              每降低 1% 的风险需要投入 ¥{costPerRiskReduction.toLocaleString()}。
            </Paragraph>
          </Card>
        </Col>
      </Row>

      <Divider />

      <Card size="small" title="各建议成本效益明细">
        <List
          size="small"
          dataSource={suggestions_applied
            .map((s, i) => ({ ...s, index: i + 1 }))
            .sort((a, b) => b.cost_effectiveness - a.cost_effectiveness)}
          renderItem={(suggestion) => (
            <List.Item>
              <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
                <Space>
                  <Tag color="blue">#{suggestion.index}</Tag>
                  <Text strong>{suggestion.target_node_name}</Text>
                  <Tag>{suggestion.suggested_action}</Tag>
                </Space>
                <Space>
                  <Tag color="green">
                    风险降低: {Math.round(suggestion.risk_reduction_estimate * 100)}%
                  </Tag>
                  <Tag>成本: ¥{suggestion.cost_estimate.toLocaleString()}</Tag>
                  <Tag color="purple">
                    成本效益比: {(suggestion.cost_effectiveness * 1000000).toFixed(2)}
                  </Tag>
                </Space>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
};

export const SplitCompareView: React.FC<SplitCompareViewProps> = ({
  result,
  onReAnalyze,
  loading = false
}) => {
  if (loading) {
    return (
      <div className="text-center py-12">
        <Spin size="large" />
        <div className="mt-4">
          <Text type="secondary">正在计算优化对比结果...</Text>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <Card size="small">
        <Empty 
          description={
            <div className="text-center">
              <Text type="secondary" className="block mb-2">
                请选择优化建议并点击"模拟优化效果"进行对比分析
              </Text>
              {onReAnalyze && (
                <Button icon={<ReloadOutlined />} onClick={onReAnalyze}>
                  重新分析
                </Button>
              )}
            </div>
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card
        size="small"
        title={
          <Space>
            <SwapOutlined />
            <span>优化效果对比分析</span>
          </Space>
        }
        extra={
          onReAnalyze && (
            <Button icon={<ReloadOutlined />} onClick={onReAnalyze}>
              重新分析
            </Button>
          )
        }
      >
        <Row gutter={[24, 16]}>
          <Col span={6}>
            <Card size="small" bordered={false} className="text-center">
              <Statistic
                title="风险降低百分比"
                value={result.comparison.risk_analysis.risk_reduction_percentage}
                suffix="%"
                valueStyle={{ color: '#3f8600' }}
                prefix={<ArrowDownOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" bordered={false} className="text-center">
              <Statistic
                title="绝对风险降低"
                value={result.comparison.risk_analysis.absolute_risk_reduction * 100}
                suffix="%"
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" bordered={false} className="text-center">
              <Statistic
                title="应用建议数"
                value={result.comparison.risk_analysis.suggestions_applied}
                prefix={<CheckCircleOutlined />}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small" bordered={false} className="text-center">
              <Statistic
                title="新增节点数"
                value={result.comparison.optimized_network.nodes_added}
                suffix="个"
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      <Card size="small">
        <Tabs defaultActiveKey="risk">
          <TabPane 
            tab={
              <Space>
                <WarningOutlined />
                <span>风险热力图对比</span>
              </Space>
            } 
            key="risk"
          >
            <RiskHeatMapCompare result={result} />
          </TabPane>
          <TabPane 
            tab={
              <Space>
                <SwapOutlined />
                <span>网络结构对比</span>
              </Space>
            } 
            key="structure"
          >
            <NetworkStructureCompare result={result} />
          </TabPane>
          <TabPane 
            tab={
              <Space>
                <CheckCircleOutlined />
                <span>成本效益分析</span>
              </Space>
            } 
            key="cost"
          >
            <CostBenefitAnalysis result={result} />
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default SplitCompareView;
