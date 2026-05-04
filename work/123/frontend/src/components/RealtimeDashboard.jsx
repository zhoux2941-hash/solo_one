import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Button,
  Space,
  Tag,
  Select,
  Switch,
  Progress,
  Tabs,
  Modal,
  message,
  Typography,
  Divider,
  List,
  Badge,
  Tooltip
} from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StopOutlined,
  CarOutlined,
  SafetyCertificateOutlined,
  RocketOutlined,
  ThunderboltOutlined,
  ReloadOutlined,
  SettingOutlined,
  EyeOutlined,
  DashboardOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import websocketService, { ControlStrategy, StrategyDescriptions, SignalPhaseState, TwinMode, TwinModeDescriptions } from '../services/websocketService';
import { realtimeApi } from '../services/api';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const COLORS = ['#52c41a', '#faad14', '#ff4d4f', '#1890ff', '#722ed1', '#eb2f96'];

function RealtimeDashboard({ simulationId, onClose }) {
  const [twinData, setTwinData] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [controlStrategy, setControlStrategy] = useState(ControlStrategy.ADAPTIVE);
  const [twinMode, setTwinMode] = useState(TwinMode.REALTIME);
  const [showSettings, setShowSettings] = useState(false);
  const [dataGeneratorRunning, setDataGeneratorRunning] = useState(false);
  
  const [flowHistory, setFlowHistory] = useState([]);
  const [queueHistory, setQueueHistory] = useState([]);
  const [speedHistory, setSpeedHistory] = useState([]);
  
  const [trafficLights, setTrafficLights] = useState([]);
  const [detectors, setDetectors] = useState([]);
  const [forecasts, setForecasts] = useState({});
  
  const [statistics, setStatistics] = useState({
    totalVehicles: 0,
    averageDelay: 0,
    averageSpeed: 0,
    totalQueueLength: 0
  });

  const currentTimeRef = useRef(0);

  useEffect(() => {
    const handleTwinUpdate = (data) => {
      if (data.twinId || (data.state && data.state.twinId)) {
        const state = data.state || data;
        setTwinData(state);
        
        if (state.isRunning !== undefined) {
          setIsRunning(state.isRunning);
        }
        if (state.isPaused !== undefined) {
          setIsPaused(state.isPaused);
        }

        if (state.trafficLights) {
          setTrafficLights(state.trafficLights);
        }

        if (state.detectors) {
          setDetectors(state.detectors);
          
          const timePoint = {
            time: formatTime(state.currentTime || currentTimeRef.current),
            timestamp: Date.now()
          };

          let totalVehicles = 0;
          let totalQueue = 0;
          let totalSpeed = 0;
          let speedCount = 0;

          for (const detector of state.detectors) {
            totalVehicles += detector.vehicleCount || 0;
            totalQueue += detector.queueLength || 0;
            if (detector.averageSpeed > 0) {
              totalSpeed += detector.averageSpeed;
              speedCount++;
            }
          }

          setFlowHistory(prev => [...prev, { ...timePoint, value: totalVehicles }].slice(-50));
          setQueueHistory(prev => [...prev, { ...timePoint, value: totalQueue }].slice(-50));
          
          const avgSpeed = speedCount > 0 ? totalSpeed / speedCount : 0;
          setSpeedHistory(prev => [...prev, { ...timePoint, value: Math.round(avgSpeed) }].slice(-50));
        }

        if (state.forecasts) {
          setForecasts(state.forecasts);
        }

        if (state.statistics) {
          setStatistics(state.statistics);
        }

        if (state.currentTime !== undefined) {
          currentTimeRef.current = state.currentTime;
        }
      }
    };

    const handleRealtimeData = (data) => {
      if (data.data) {
        const sensorData = data.data;
        
        setFlowHistory(prev => {
          const last = prev[prev.length - 1];
          if (last && last.timestamp === Date.now()) {
            return prev;
          }
          return [...prev, {
            time: formatTime(currentTimeRef.current),
            value: sensorData.vehicleCount || 0,
            timestamp: Date.now()
          }].slice(-50);
        });
      }
    };

    websocketService.subscribeToTwin(handleTwinUpdate);
    websocketService.subscribeToRealtime(handleRealtimeData);

    websocketService.connect();

    return () => {
      websocketService.unsubscribeFromTwin(handleTwinUpdate);
      websocketService.unsubscribeFromRealtime(handleRealtimeData);
    };
  }, [simulationId]);

  const formatTime = (seconds) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTwin = async () => {
    try {
      const result = await realtimeApi.startDigitalTwin({
        simulationId,
        mode: twinMode,
        controlStrategy,
        startDataGenerator: true,
        generatorOptions: {
          interval: 1000,
          baseFlow: 300,
          congestionLevel: 'normal',
          includeCongestionSpikes: true
        }
      });

      setIsRunning(true);
      setDataGeneratorRunning(true);
      message.success('数字孪生已启动');
    } catch (error) {
      message.error('启动失败: ' + (error.message || '未知错误'));
    }
  };

  const handlePauseTwin = async () => {
    try {
      await realtimeApi.pauseDigitalTwin(simulationId);
      setIsPaused(true);
      message.info('数字孪生已暂停');
    } catch (error) {
      message.error('暂停失败');
    }
  };

  const handleResumeTwin = async () => {
    try {
      await realtimeApi.resumeDigitalTwin(simulationId);
      setIsPaused(false);
      message.success('数字孪生已恢复');
    } catch (error) {
      message.error('恢复失败');
    }
  };

  const handleStopTwin = async () => {
    try {
      await realtimeApi.stopDigitalTwin(simulationId);
      setIsRunning(false);
      setIsPaused(false);
      setDataGeneratorRunning(false);
      message.info('数字孪生已停止');
    } catch (error) {
      message.error('停止失败');
    }
  };

  const handleStrategyChange = async (strategy) => {
    setControlStrategy(strategy);
    if (isRunning) {
      try {
        for (const tl of trafficLights) {
          await realtimeApi.setControlStrategy(simulationId, tl.intersectionId, strategy);
        }
        message.success(`已切换控制策略为: ${StrategyDescriptions[strategy]}`);
      } catch (error) {
        message.error('策略切换失败');
      }
    }
  };

  const getPhaseColor = (state) => {
    switch (state) {
      case SignalPhaseState.GREEN:
        return '#52c41a';
      case SignalPhaseState.YELLOW:
        return '#faad14';
      case SignalPhaseState.RED:
        return '#ff4d4f';
      default:
        return '#d9d9d9';
    }
  };

  const getPhaseBadge = (state) => {
    const color = getPhaseColor(state);
    const status = state === SignalPhaseState.GREEN ? 'success' : 
                   state === SignalPhaseState.YELLOW ? 'warning' : 'error';
    return <Badge status={status} text={state?.toUpperCase() || '未知'} />;
  };

  const detectorColumns = [
    {
      title: '路段 ID',
      dataIndex: 'edgeId',
      key: 'edgeId',
      width: 120
    },
    {
      title: '排队长度',
      dataIndex: 'queueLength',
      key: 'queueLength',
      render: (val) => (
        <Space>
          <Text strong>{val}</Text>
          <Text type="secondary">辆</Text>
        </Space>
      )
    },
    {
      title: '平均速度',
      dataIndex: 'averageSpeed',
      key: 'averageSpeed',
      render: (val) => (
        <Space>
          <Text strong>{val?.toFixed(1) || 0}</Text>
          <Text type="secondary">m/s</Text>
        </Space>
      )
    },
    {
      title: '占有率',
      dataIndex: 'occupancy',
      key: 'occupancy',
      render: (val) => (
        <Progress 
          percent={Math.min(100, Math.round(val || 0))} 
          size="small" 
          strokeColor={val > 70 ? '#ff4d4f' : val > 40 ? '#faad14' : '#52c41a'}
        />
      )
    }
  ];

  const trafficLightColumns = [
    {
      title: '路口 ID',
      dataIndex: 'intersectionId',
      key: 'intersectionId',
      width: 150
    },
    {
      title: '当前灯态',
      dataIndex: 'currentState',
      key: 'currentState',
      render: getPhaseBadge
    },
    {
      title: '当前相位',
      dataIndex: 'currentPhaseIndex',
      key: 'currentPhaseIndex',
      render: (val, record) => (
        <Space>
          <Tag color="blue">{val}</Tag>
          <Text type="secondary">/{record.phases?.length || 0}</Text>
        </Space>
      )
    },
    {
      title: '已持续时间',
      dataIndex: 'phaseElapsedTime',
      key: 'phaseElapsedTime',
      render: (val) => (
        <Space>
          <Text strong>{val?.toFixed(1) || 0}</Text>
          <Text type="secondary">秒</Text>
        </Space>
      )
    },
    {
      title: '绿灯延长次数',
      dataIndex: 'greenExtensions',
      key: 'greenExtensions',
      render: (val, record) => (
        <Space>
          <Text strong>{val || 0}</Text>
          <Text type="secondary">/{record.maxExtensions || 3}</Text>
        </Space>
      )
    }
  ];

  const getCongestionLevel = (queueLength, occupancy) => {
    if (queueLength > 15 || occupancy > 70) return { level: '严重拥堵', color: '#ff4d4f', status: 'error' };
    if (queueLength > 8 || occupancy > 40) return { level: '拥堵', color: '#faad14', status: 'warning' };
    return { level: '畅通', color: '#52c41a', status: 'success' };
  };

  const overallCongestion = (() => {
    let totalQueue = 0;
    let totalOccupancy = 0;
    let count = 0;

    for (const detector of detectors) {
      totalQueue += detector.queueLength || 0;
      totalOccupancy += detector.occupancy || 0;
      count++;
    }

    const avgQueue = count > 0 ? totalQueue / count : 0;
    const avgOccupancy = count > 0 ? totalOccupancy / count : 0;

    return getCongestionLevel(avgQueue, avgOccupancy);
  })();

  return (
    <div style={{ padding: 16, background: '#f0f2f5', minHeight: '100vh' }}>
      <Card>
        <Row justify="space-between" align="middle">
          <Col>
            <Space>
              <DashboardOutlined style={{ fontSize: 28, color: '#1890ff' }} />
              <Title level={3} style={{ margin: 0 }}>实时监控大屏</Title>
              <Tag color={twinMode === TwinMode.PREDICTIVE ? 'purple' : 'blue'}>
                {TwinModeDescriptions[twinMode]}
              </Tag>
              <Tag color={controlStrategy === ControlStrategy.Q_LEARNING ? 'magenta' : 'cyan'}>
                {StrategyDescriptions[controlStrategy]}
              </Tag>
            </Space>
          </Col>
          <Col>
            <Space>
              {!isRunning ? (
                <Button 
                  type="primary" 
                  icon={<PlayCircleOutlined />} 
                  onClick={handleStartTwin}
                  size="large"
                >
                  启动数字孪生
                </Button>
              ) : (
                <Space>
                  {!isPaused ? (
                    <Button 
                      icon={<PauseCircleOutlined />} 
                      onClick={handlePauseTwin}
                      size="large"
                    >
                      暂停
                    </Button>
                  ) : (
                    <Button 
                      type="primary"
                      icon={<PlayCircleOutlined />} 
                      onClick={handleResumeTwin}
                      size="large"
                    >
                      恢复
                    </Button>
                  )}
                  <Button 
                    danger 
                    icon={<StopOutlined />} 
                    onClick={handleStopTwin}
                    size="large"
                  >
                    停止
                  </Button>
                </Space>
              )}
              <Button 
                icon={<SettingOutlined />} 
                onClick={() => setShowSettings(true)}
                size="large"
              >
                设置
              </Button>
              {onClose && (
                <Button onClick={onClose} size="large">
                  关闭
                </Button>
              )}
            </Space>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="运行时间"
              value={formatTime(twinData?.currentTime || 0)}
              prefix={<SyncOutlined spin={isRunning && !isPaused} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="路网整体状态"
              value={overallCongestion.level}
              prefix={<SafetyCertificateOutlined />}
              valueStyle={{ color: overallCongestion.color }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="总排队长度"
              value={statistics.totalQueueLength}
              suffix="辆"
              prefix={<CarOutlined />}
              valueStyle={{ color: statistics.totalQueueLength > 30 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="平均速度"
              value={statistics.averageSpeed.toFixed(1)}
              suffix="m/s"
              prefix={<RocketOutlined />}
              valueStyle={{ color: statistics.averageSpeed < 10 ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24}>
          <Card>
            <Tabs defaultActiveKey="flow">
              <TabPane tab="车流量趋势" key="flow">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={flowHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#1890ff" name="车辆数" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </TabPane>
              <TabPane tab="排队长度趋势" key="queue">
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={queueHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Area type="monotone" dataKey="value" stroke="#faad14" fill="#faad14" fillOpacity={0.3} name="排队长度" />
                  </AreaChart>
                </ResponsiveContainer>
              </TabPane>
              <TabPane tab="平均速度趋势" key="speed">
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={speedHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="value" stroke="#52c41a" name="速度 (m/s)" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </TabPane>
            </Tabs>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col span={24} lg={14}>
          <Card 
            title={
              <Space>
                <ThunderboltOutlined />
                <span>检测器实时数据</span>
                <Badge status={isRunning ? 'processing' : 'default'} />
              </Space>
            }
          >
            <Table 
              columns={detectorColumns} 
              dataSource={detectors}
              rowKey="edgeId"
              size="small"
              pagination={false}
              scroll={{ y: 300 }}
            />
          </Card>
        </Col>
        <Col span={24} lg={10}>
          <Card 
            title={
              <Space>
                <SafetyCertificateOutlined />
                <span>信号灯状态</span>
                <Badge status={isRunning ? 'processing' : 'default'} />
              </Space>
            }
          >
            <Table 
              columns={trafficLightColumns} 
              dataSource={trafficLights}
              rowKey="intersectionId"
              size="small"
              pagination={false}
              scroll={{ y: 300 }}
            />
          </Card>
        </Col>
      </Row>

      {Object.keys(forecasts).length > 0 && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col span={24}>
            <Card 
              title={
                <Space>
                  <EyeOutlined />
                  <span>预测分析</span>
                  <Tag color="purple">预测模式</Tag>
                </Space>
              }
            >
              <Row gutter={[16, 16]}>
                {Object.entries(forecasts).map(([edgeId, forecast], index) => {
                  const congestion = getCongestionLevel(0, 0);
                  return (
                    <Col xs={24} sm={12} md={8} key={edgeId}>
                      <Card size="small" title={`路段 ${edgeId}`}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <Row justify="space-between">
                            <Text type="secondary">拥堵概率</Text>
                            <Tag color={forecast.congestionProbability > 0.7 ? 'red' : forecast.congestionProbability > 0.4 ? 'orange' : 'green'}>
                              {Math.round(forecast.congestionProbability * 100)}%
                            </Tag>
                          </Row>
                          <Row justify="space-between">
                            <Text type="secondary">排队趋势</Text>
                            <Text strong style={{ color: forecast.trend.queueGrowth > 0 ? '#ff4d4f' : '#52c41a' }}>
                              {forecast.trend.queueGrowth > 0 ? '上升' : '下降'}
                            </Text>
                          </Row>
                          <Divider style={{ margin: '8px 0' }} />
                          <Text type="secondary" small>
                            预测排队长度: {forecast.queueLengthForecast?.map(v => Math.round(v)).slice(0, 5).join(', ')}...
                          </Text>
                        </Space>
                      </Card>
                    </Col>
                  );
                })}
              </Row>
            </Card>
          </Col>
        </Row>
      )}

      <Modal
        title="数字孪生设置"
        open={showSettings}
        onCancel={() => setShowSettings(false)}
        footer={
          <Button onClick={() => setShowSettings(false)}>
            关闭
          </Button>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div>
            <Title level={5}>孪生模式</Title>
            <Select 
              value={twinMode} 
              onChange={setTwinMode}
              style={{ width: '100%' }}
              disabled={isRunning}
            >
              {Object.entries(TwinModeDescriptions).map(([mode, desc]) => (
                <Option key={mode} value={mode}>{desc}</Option>
              ))}
            </Select>
            <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
              预测模式会根据历史数据预测未来30秒的交通状态
            </Text>
          </div>

          <div>
            <Title level={5}>控制策略</Title>
            <Select 
              value={controlStrategy} 
              onChange={handleStrategyChange}
              style={{ width: '100%' }}
            >
              {Object.entries(StrategyDescriptions).map(([strategy, desc]) => (
                <Option key={strategy} value={strategy}>{desc}</Option>
              ))}
            </Select>
            <Text type="secondary" style={{ marginTop: 8, display: 'block' }}>
              自适应控制会根据实时排队长度动态调整绿灯时长
            </Text>
          </div>

          <div>
            <Title level={5}>策略说明</Title>
            <List
              size="small"
              dataSource={[
                { key: ControlStrategy.FIXED_TIME, desc: '固定配时，不随流量变化' },
                { key: ControlStrategy.ACTUATED, desc: '感应控制，根据检测器延长绿灯' },
                { key: ControlStrategy.ADAPTIVE, desc: '自适应控制，压力最大相位优先' },
                { key: ControlStrategy.MAX_PRESSURE, desc: '最大压力控制，排队最长相位优先' },
                { key: ControlStrategy.Q_LEARNING, desc: 'Q学习控制，基于历史奖励优化' }
              ]}
              renderItem={(item) => (
                <List.Item>
                  <Tag color={controlStrategy === item.key ? 'blue' : 'default'}>
                    {StrategyDescriptions[item.key]}
                  </Tag>
                  <Text type="secondary" style={{ marginLeft: 8 }}>{item.desc}</Text>
                </List.Item>
              )}
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
}

export default RealtimeDashboard;
