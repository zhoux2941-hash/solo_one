import React, { useState } from 'react';
import {
  Tabs,
  Card,
  List,
  Button,
  Form,
  Input,
  InputNumber,
  Select,
  Divider,
  Statistic,
  Tag,
  Progress,
  Space,
  message,
  Popconfirm,
  Typography
} from 'antd';
import {
  CarOutlined,
  ThunderboltOutlined,
  BarChartOutlined,
  ExperimentOutlined,
  HistoryOutlined,
  BulbOutlined
} from '@ant-design/icons';
import useAppStore from '../store/appStore';
import { simulationApi, resultApi, optimizationApi } from '../services/api';
const { Title, Text } = Typography;
const { Option } = Select;

function Sidebar() {
 const {
 mode,
 network,
 trafficLights,
 trafficFlows,
 simulations,
 currentSimulation,
 results,
 optimization,
 setTrafficLights,
 addTrafficLight,
 updateTrafficLight,
 removeTrafficLight,
 setTrafficFlows,
 addTrafficFlow,
 updateTrafficFlow,
 removeTrafficFlow,
 setCurrentSimulation,
 setSimulations,
 setResults,
 setVisualization,
 setOptimization
 } = useAppStore();
 const [selectedNode, setSelectedNode] = useState(null);
 const [loadingSimulations, setLoadingSimulations] = useState(false);
 const [loadingResults, setLoadingResults] = useState(false);
 const [optimizing, setOptimizing] = useState(false);
 const loadSimulations = async () => {
 setLoadingSimulations(true);
 try {
 const result = await simulationApi.list('all');
 setSimulations(result.simulations || []);
 } catch (error) {
 message.error(`加载仿真任务失败: ${error.message}`);
 } finally {
 setLoadingSimulations(false);
 }
 };
 const startSimulation = async (simulationId) => {
 try {
 await simulationApi.start(simulationId);
 message.success('仿真任务已启动');
 loadSimulations();
 } catch (error) {
 message.error(`启动仿真失败: ${error.message}`);
 }
 };
 const loadSimulationResults = async (simulationId) => {
 setLoadingResults(true);
 try {
 const [trajectory, snapshotList, heatmap, statistics] = await Promise.all([
 resultApi.getTrajectory(simulationId),
 resultApi.getSnapshotList(simulationId),
 resultApi.getHeatmap(simulationId),
 resultApi.getStatistics(simulationId)
 ]);
 const snapshots = [];
 for (let i = 0; i < Math.min(snapshotList.totalSnapshots, 100); i++) {
 try {
 const snapshot = await resultApi.getSnapshot(simulationId, i);
 snapshots.push(snapshot);
 } catch (e) {
 break;
 }
 }
 setResults({
 trajectories: trajectory.trajectories || [],
 snapshots,
 heatmapData: heatmap,
 statistics: statistics.statistics
 });
 setVisualization({
 currentTime: 0,
 totalTime: trajectory.metadata?.endTime || 3600,
 isPlaying: false
 });
 setCurrentSimulation(simulationId);
 message.success('结果加载完成');
 } catch (error) {
 message.error(`加载仿真结果失败: ${error.message}`);
 } finally {
 setLoadingResults(false);
 }
 };
 const addTrafficLightForNode = () => {
 if (!selectedNode) {
 message.warning('请先选择一个节点');
 return;
 }
 const existing = trafficLights.find(tl => tl.intersectionId === selectedNode.id);
 if (existing) {
 message.warning('该节点已有信号灯配置');
 return;
 }
 addTrafficLight({
 intersectionId: selectedNode.id,
 phases: [
 { duration: 30, state: 'GrGr' },
 { duration: 3, state: 'yryr' },
 { duration: 30, state: 'rGrG' },
 { duration: 3, state: 'ryry' }
 ]
 });
 message.success('已添加信号灯配置');
 };
 const runOptimization = async () => {
 if (trafficLights.length === 0) {
 message.warning('请先配置信号灯');
 return;
 }
 setOptimizing(true);
 setOptimization({ isOptimizing: true, result: null });
 try {
 const result = await optimizationApi.optimizeIntersection({
 intersectionId: trafficLights[0].intersectionId,
 network,
 trafficLights,
 trafficFlows,
 optimizationConfig: {
 populationSize: 20,
 generations: 30
 }
 });
 setOptimization({
 isOptimizing: false,
 result: result.result
 });
 message.success('优化完成');
 } catch (error) {
 message.error(`优化失败: ${error.message}`);
 setOptimization({ isOptimizing: false, result: null });
 } finally {
 setOptimizing(false);
 }
 };
 const renderNetworkTab = () => (<Card size="small" title="道路网络信息" extra={<Tag color={network.nodes.length > 0 ? 'green' : 'orange'}>
 {mode === 'drawing' ? '绘制模式' : '查看模式'}
 </Tag>}>
 <Space direction="vertical" style={{ width: '100%' }}>
 <Statistic title="节点数量" value={network.nodes.length} prefix={<CarOutlined />}/>
 <Statistic title="道路数量" value={network.edges.length} prefix={<CarOutlined />}/>
 
 <Divider>节点列表</Divider>
 <List size="small" dataSource={network.nodes} renderItem={(node) => (<List.Item actions={[
 <Button size="small" type="link" onClick={() => setSelectedNode(node)}>
 选择
 </Button>
 ]}>
 <Space>
 <Tag color={trafficLights.some(tl => tl.intersectionId === node.id) ? 'red' : 'blue'}>
 {node.id}
 </Tag>
 <Text type="secondary">
 ({node.x.toFixed(4)}, {node.y.toFixed(4)})
 </Text>
 </Space>
 </List.Item>)}/>

 {selectedNode && (<>
 <Divider>选中节点</Divider>
 <Card size="small">
 <Space direction="vertical" style={{ width: '100%' }}>
 <Text strong>{selectedNode.id}</Text>
 <Text>坐标: ({selectedNode.x.toFixed(4)}, {selectedNode.y.toFixed(4)})</Text>
 <Button type="primary" onClick={addTrafficLightForNode} disabled={trafficLights.some(tl => tl.intersectionId === selectedNode.id)}>
 添加信号灯配置
 </Button>
 </Space>
 </Card>
 </>)}
 </Space>
 </Card>);
 const renderTrafficLightsTab = () => (<Card size="small" title="信号灯配置">
 <Space direction="vertical" style={{ width: '100%' }}>
 {trafficLights.length === 0 ? (<Text type="secondary" italic>
 暂无信号灯配置。请在地图上选择一个节点，然后添加信号灯配置。
 </Text>) : (<List size="small" dataSource={trafficLights} renderItem={(tl) => (<List.Item actions={[
 <Popconfirm title="确定删除此信号灯配置？" onConfirm={() => {
 removeTrafficLight(tl.intersectionId);
 message.info('已删除');
 }}>
 <Button size="small" danger type="link">删除</Button>
 </Popconfirm>
 ]}>
 <Card size="small" title={`交叉口: ${tl.intersectionId}`} style={{ width: '100%' }}>
 <List size="small" dataSource={tl.phases} renderItem={(phase, index) => (<List.Item>
 <Space>
 <Tag color={phase.state.includes('G') ? 'green' : 'orange'}>
 相位 {index + 1}
 </Tag>
 <Text>状态: {phase.state}</Text>
 <InputNumber min={1} max={120} value={phase.duration} onChange={(value) => {
 const newPhases = [...tl.phases];
 newPhases[index] = { ...phase, duration: value };
 updateTrafficLight(tl.intersectionId, { phases: newPhases });
 }} addonAfter="秒"/>
 </Space>
 </List.Item>)}/>
 </Card>
 </List.Item>)}/>)}
 </Space>
 </Card>);
 const renderTrafficFlowsTab = () => (<Card size="small" title="车流量配置" extra={<Button size="small" type="primary" onClick={() => {
 addTrafficFlow({
 id: `flow_${Date.now()}`,
 type: 'flow',
 begin: 0,
 end: 3600,
 vehsPerHour: 600,
 routeIndex: 0
 });
 }}>
 添加车流量
 </Button>}>
 <Space direction="vertical" style={{ width: '100%' }}>
 {trafficFlows.length === 0 ? (<Text type="secondary" italic>
 暂无车流量配置。点击上方按钮添加默认车流量配置。
 </Text>) : (<List size="small" dataSource={trafficFlows} renderItem={(flow) => (<List.Item actions={[
 <Popconfirm title="确定删除此车流量？" onConfirm={() => {
 removeTrafficFlow(flow.id);
 message.info('已删除');
 }}>
 <Button size="small" danger type="link">删除</Button>
 </Popconfirm>
 ]}>
 <Card size="small">
 <Form layout="vertical">
 <Form.Item label="流量类型">
 <Select value={flow.type} onChange={(value) => updateTrafficFlow(flow.id, { type: value })} style={{ width: '100%' }}>
 <Option value="flow">持续流量</Option>
 <Option value="vehicle">单车</Option>
 </Select>
 </Form.Item>

 {flow.type === 'flow' && (<>
 <Form.Item label="开始时间">
 <InputNumber min={0} value={flow.begin} onChange={(value) => updateTrafficFlow(flow.id, { begin: value })} style={{ width: '100%' }} addonAfter="秒"/>
 </Form.Item>
 <Form.Item label="结束时间">
 <InputNumber min={0} value={flow.end} onChange={(value) => updateTrafficFlow(flow.id, { end: value })} style={{ width: '100%' }} addonAfter="秒"/>
 </Form.Item>
 <Form.Item label="每小时车辆数">
 <InputNumber min={0} max={3600} value={flow.vehsPerHour} onChange={(value) => updateTrafficFlow(flow.id, { vehsPerHour: value })} style={{ width: '100%' }}/>
 </Form.Item>
 </>)}

 {flow.type === 'vehicle' && (<Form.Item label="出发时间">
 <InputNumber min={0} value={flow.depart || 0} onChange={(value) => updateTrafficFlow(flow.id, { depart: value })} style={{ width: '100%' }} addonAfter="秒"/>
 </Form.Item>)}
 </Form>
 </Card>
 </List.Item>)}/>)}
 </Space>
 </Card>);
 const renderSimulationsTab = () => (<Card size="small" title="仿真任务管理" extra={<Button size="small" onClick={loadSimulations} loading={loadingSimulations}>
 刷新
 </Button>}>
 <Space direction="vertical" style={{ width: '100%' }}>
 <Button type="primary" onClick={loadSimulations} block>
 加载所有仿真任务
 </Button>

 <Divider/>

 {simulations.length === 0 ? (<Text type="secondary" italic>
 暂无仿真任务。先创建道路网络，然后点击"创建仿真"按钮。
 </Text>) : (<List size="small" dataSource={simulations} renderItem={(sim) => (<List.Item actions={[
 <Button size="small" type="link" disabled={sim.status !== 'pending'} onClick={() => startSimulation(sim.id)}>
 启动
 </Button>,
 <Button size="small" type="link" disabled={sim.status !== 'completed'} onClick={() => loadSimulationResults(sim.id)} loading={loadingResults}>
 查看结果
 </Button>
 ]}>
 <Space direction="vertical" style={{ width: '100%' }}>
 <Space>
 <Tag color={sim.status === 'completed' ? 'green' :
 sim.status === 'running' ? 'blue' :
 sim.status === 'failed' ? 'red' : 'orange'}>
 {sim.status === 'pending' ? '待开始' :
 sim.status === 'running' ? '运行中' :
 sim.status === 'completed' ? '已完成' : '失败'}
 </Tag>
 <Text strong>{sim.id.slice(0, 8)}...</Text>
 </Space>
 <Text type="secondary">
 节点: {sim.network?.nodeCount || 0} | 道路: {sim.network?.edgeCount || 0}
 </Text>
 {sim.status === 'running' && (<Progress percent={50} status="active" size="small"/>)}
 </Space>
 </List.Item>)}/>)}
 </Space>
 </Card>);
 const renderResultsTab = () => (<Card size="small" title="仿真结果">
 <Space direction="vertical" style={{ width: '100%' }}>
 {!currentSimulation ? (<Text type="secondary" italic>
 请先加载一个仿真任务的结果
 </Text>) : results.statistics ? (<>
 <Card size="small" title="统计信息">
 <Statistic title="总车辆数" value={results.statistics.totalTrips} suffix="辆"/>
 <Statistic title="平均行程时间" value={results.statistics.averageTravelTime?.toFixed(2)} suffix="秒"/>
 <Statistic title="平均延误" value={results.statistics.averageDelay?.toFixed(2)} suffix="秒"/>
 <Statistic title="平均车速" value={results.statistics.averageSpeed?.toFixed(2)} suffix="m/s"/>
 </Card>

 <Divider>提示</Divider>
 <Text type="secondary">
 使用底部时间轴回放车辆运动。可在地图右上角切换热力图图层。
 </Text>
 </>) : (<Text type="secondary">加载中...</Text>)}
 </Space>
 </Card>);
 const renderOptimizationTab = () => (<Card size="small" title="信号灯优化建议">
 <Space direction="vertical" style={{ width: '100%' }}>
 <Text type="secondary">
 使用遗传算法优化信号灯配时，提升交叉口通行效率。
 </Text>

 <Button type="primary" onClick={runOptimization} loading={optimizing} disabled={trafficLights.length === 0} block>
 运行优化算法
 </Button>

 <Divider/>

 {optimization.result && (<div className="optimization-result">
 <Title level={5}>优化结果</Title>

 <div className="improvement-badge">
 预计延误减少 {optimization.result.improvement.improvementPercentage}%
 </div>

 <Divider>相位对比</Divider>
 {optimization.result.originalConfig.phases?.map((phase, index) => {
 const optimizedPhase = optimization.result.optimizedConfig.phases[index];
 const isGreen = !phase.state.includes('y');
 if (!isGreen)
 return null;
 const originalDuration = phase.duration;
 const optimizedDuration = optimizedPhase?.duration || phase.duration;
 const maxDuration = Math.max(originalDuration, optimizedDuration);
 return (<div key={index} className="phase-comparison">
 <Tag>相位 {index + 1}</Tag>
 <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
 <div style={{ flex: 1 }}>
 <Text type="secondary">原始</Text>
 <div className="phase-bar phase-bar-original" style={{ width: `${(originalDuration / maxDuration) * 100}%` }}>
 <Text style={{ color: 'white', paddingLeft: '8px', fontSize: '12px' }}>
 {originalDuration}s
 </Text>
 </div>
 </div>
 <div style={{ flex: 1 }}>
 <Text type="secondary">优化后</Text>
 <div className="phase-bar phase-bar-optimized" style={{ width: `${(optimizedDuration / maxDuration) * 100}%` }}>
 <Text style={{ color: 'white', paddingLeft: '8px', fontSize: '12px' }}>
 {optimizedDuration}s
 </Text>
 </div>
 </div>
 </div>
 </div>);
 })}

 <Divider>建议</Divider>
 <List size="small" dataSource={optimization.result.recommendations?.filter(r => r.type !== 'summary')} renderItem={(rec) => (<List.Item>
 <Space direction="vertical">
 <Tag color={rec.action === 'increase' ? 'green' :
 rec.action === 'decrease' ? 'orange' : 'blue'}>
 相位 {rec.phase}: {rec.action === 'increase' ? '增加' :
 rec.action === 'decrease' ? '减少' : '保持'}
 </Tag>
 <Text>
 {rec.originalDuration}s → {rec.newDuration}s ({rec.change}s)
 </Text>
 <Text type="secondary" italic>{rec.reason}</Text>
 </Space>
 </List.Item>)}/>

 {optimization.result.recommendations?.find(r => r.type === 'summary') && (<Card size="small" style={{ marginTop: '16px' }}>
 <Text strong>
 {optimization.result.recommendations.find(r => r.type === 'summary')?.message}
 </Text>
 </Card>)}

 <Button type="primary" onClick={() => {
 const optimizedConfig = optimization.result.optimizedConfig;
 if (optimizedConfig) {
 const tl = trafficLights.find(t => t.intersectionId === optimizedConfig.intersectionId);
 if (tl) {
 updateTrafficLight(optimizedConfig.intersectionId, {
 phases: optimizedConfig.phases
 });
 message.success('已应用优化配置');
 }
 }
 }} block style={{ marginTop: '16px' }}>
 应用优化配置
 </Button>
 </div>)}
 </Space>
 </Card>);
 const tabItems = [
 {
 key: 'network',
 label: <span><CarOutlined/> 网络</span>,
 children: renderNetworkTab()
 },
 {
 key: 'trafficLights',
 label: <span><ThunderboltOutlined/> 信号灯</span>,
 children: renderTrafficLightsTab()
 },
 {
 key: 'trafficFlows',
 label: <span><BarChartOutlined/> 车流量</span>,
 children: renderTrafficFlowsTab()
 },
 {
 key: 'simulations',
 label: <span><ExperimentOutlined/> 仿真</span>,
 children: renderSimulationsTab()
 },
 {
 key: 'results',
 label: <span><HistoryOutlined/> 结果</span>,
 children: renderResultsTab()
 },
 {
 key: 'optimization',
 label: <span><BulbOutlined/> 优化</span>,
 children: renderOptimizationTab()
 }
 ];
 return (<div className="sidebar">
 <div className="sidebar-header">
 <Title level={4} style={{ margin: 0 }}>交通网络仿真平台</Title>
 </div>
 <div className="sidebar-content">
 <Tabs defaultActiveKey="network" items={tabItems} size="small"/>
 </div>
 </div>);
}
export default Sidebar;

