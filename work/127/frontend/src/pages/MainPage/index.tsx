import React, { useEffect, useState } from 'react';
import { Layout, Menu, Button, Space, Typography, Dropdown, Modal, Form, Input, message, Tag, theme } from 'antd';
import {
  NetworkOutlined,
  PlusOutlined,
  SettingOutlined,
  DatabaseOutlined,
  ThunderboltOutlined,
  ImportOutlined,
  ReloadOutlined,
  EditOutlined,
  LinkOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useAppStore } from '@/store';
import { networkApi, optimizationApi } from '@/api';
import type { SupplyChainNetwork, SimulatedOptimizationResult } from '@/api';
import ForceGraph from '@/components/ForceGraph';
import SimulationPanel from '@/components/SimulationPanel';
import ResultsPanel from '@/components/ResultsPanel';
import ImportExportPanel from '@/components/ImportExportPanel';
import OptimizationPanel from '@/components/OptimizationPanel';
import NodeEditor from '@/components/NodeEditor';
import DependencyEditor from '@/components/DependencyEditor';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

type TabKey = 'graph' | 'simulation' | 'results' | 'optimization' | 'import';

const MainPage: React.FC = () => {
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  const {
    networks,
    setNetworks,
    currentNetwork,
    setCurrentNetwork,
    nodes,
    setNodes,
    dependencies,
    setDependencies,
    graphNodes,
    graphLinks,
    setGraphData,
    selectedNode,
    setSelectedNode,
    disruptedNodes,
    simulationResult,
    animationStep,
    toggleDisruptedNode,
    clearDisruptedNodes,
  } = useAppStore();

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('graph');
  const [createNetworkModal, setCreateNetworkModal] = useState(false);
  const [nodeEditorVisible, setNodeEditorVisible] = useState(false);
  const [dependencyEditorVisible, setDependencyEditorVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [simulatedOptimizationResult, setSimulatedOptimizationResult] = useState<SimulatedOptimizationResult | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadNetworks();
  }, []);

  useEffect(() => {
    if (currentNetwork) {
      loadNetworkData(currentNetwork.id);
    }
  }, [currentNetwork]);

  const loadNetworks = async () => {
    try {
      const data = await networkApi.getAll();
      setNetworks(data);
    } catch (error) {
      console.error('Failed to load networks:', error);
    }
  };

  const loadNetworkData = async (networkId: string) => {
    setLoading(true);
    try {
      const [nodesData, depsData, graphData] = await Promise.all([
        networkApi.getNodes(networkId),
        networkApi.getDependencies(networkId),
        networkApi.getGraph(networkId),
      ]);

      setNodes(nodesData);
      setDependencies(depsData);
      setGraphData(graphData.nodes, graphData.links);
    } catch (error) {
      message.error('加载网络数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNetwork = async (values: any) => {
    try {
      const network = await networkApi.create({
        name: values.name,
        description: values.description,
      });
      await loadNetworks();
      setCurrentNetwork(network);
      message.success('网络创建成功');
      setCreateNetworkModal(false);
      form.resetFields();
    } catch (error) {
      message.error('创建网络失败');
    }
  };

  const handleNetworkSelect: MenuProps['onClick'] = (e) => {
    const network = networks.find(n => n.id === e.key);
    if (network) {
      setCurrentNetwork(network);
    }
  };

  const handleNodeClick = (node: any) => {
    if (editMode) {
      toggleDisruptedNode(node.id);
    } else {
      setSelectedNode(node.id);
    }
  };

  const handleRefresh = () => {
    if (currentNetwork) {
      loadNetworkData(currentNetwork.id);
    }
  };

  const handleNodeCreate = (position: { x: number; y: number }) => {
    setNodeEditorVisible(true);
  };

  const handleNodeCreateSuccess = () => {
    setNodeEditorVisible(false);
    handleRefresh();
  };

  const handleDependencyCreateSuccess = () => {
    setDependencyEditorVisible(false);
    handleRefresh();
  };

  const networkMenuItems: MenuProps['items'] = [
    {
      key: 'create',
      icon: <PlusOutlined />,
      label: '创建新网络',
      onClick: () => setCreateNetworkModal(true),
    },
    { type: 'divider' },
    ...networks.map(network => ({
      key: network.id,
      icon: <NetworkOutlined />,
      label: (
        <Space>
          <span>{network.name}</span>
          <Tag size="small" color="blue">
            {network.node_count}节点
          </Tag>
        </Space>
      ),
    })),
  ];

  const tabItems: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'graph', label: '网络视图', icon: <NetworkOutlined /> },
    { key: 'simulation', label: '风险模拟', icon: <ThunderboltOutlined /> },
    { key: 'results', label: '分析结果', icon: <DatabaseOutlined /> },
    { key: 'optimization', label: '优化建议', icon: <RocketOutlined /> },
    { key: 'import', label: '数据导入', icon: <ImportOutlined /> },
  ];

  const getSimulationResultsArray = () => {
    if (!simulationResult) return [];
    return Object.values(simulationResult.node_results);
  };

  const handleOptimizationCompare = async (selectedSuggestions: number[]) => {
    if (!currentNetwork) return;
    try {
      const result = await optimizationApi.simulateOptimization(
        currentNetwork.id,
        selectedSuggestions
      );
      setSimulatedOptimizationResult(result);
    } catch (error: any) {
      message.error(error.response?.data?.detail || '模拟优化失败');
    }
  };

  return (
    <Layout style={{ height: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', padding: '0 24px' }}>
        <Space>
          <NetworkOutlined style={{ fontSize: 24, color: '#fff' }} />
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            供应链风险分析工具
          </Title>
        </Space>
        <Space style={{ marginLeft: 'auto' }}>
          {currentNetwork && (
            <Space>
              <Tag color="green">{currentNetwork.name}</Tag>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={loading}
              >
                刷新
              </Button>
            </Space>
          )}
          <Button icon={<SettingOutlined />}>设置</Button>
        </Space>
      </Header>

      <Layout>
        <Sider width={250} style={{ background: colorBgContainer }}>
          <div style={{ padding: 16 }}>
            <Title level={5}>供应链网络</Title>
            <Menu
              mode="inline"
              selectedKeys={currentNetwork ? [currentNetwork.id] : []}
              items={networkMenuItems}
              onClick={handleNetworkSelect}
              style={{ borderRight: 0 }}
            />
          </div>
        </Sider>

        <Layout>
          <Header
            style={{
              padding: '0 24px',
              background: colorBgContainer,
              borderBottom: '1px solid #f0f0f0',
            }}
          >
            <Menu
              mode="horizontal"
              selectedKeys={[activeTab]}
              items={tabItems.map(item => ({
                key: item.key,
                icon: item.icon,
                label: item.label,
              }))}
              onClick={({ key }) => setActiveTab(key as TabKey)}
              style={{ borderBottom: 0 }}
            />
          </Header>

          <Content
            style={{
              margin: 0,
              padding: 24,
              minHeight: 280,
              background: '#f5f5f5',
              display: 'flex',
            }}
          >
            {!currentNetwork ? (
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: colorBgContainer,
                  borderRadius: 8,
                }}
              >
                <div className="text-center">
                  <NetworkOutlined style={{ fontSize: 64, color: '#999' }} />
                  <Title level={4} style={{ marginTop: 16, color: '#666' }}>
                    请选择或创建供应链网络
                  </Title>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    size="large"
                    onClick={() => setCreateNetworkModal(true)}
                  >
                    创建新网络
                  </Button>
                </div>
              </div>
            ) : (
              <>
                {activeTab === 'graph' && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div
                      style={{
                        padding: '8px 16px',
                        background: colorBgContainer,
                        borderBottom: '1px solid #f0f0f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <Space>
                        <Button
                          type={editMode ? 'primary' : 'default'}
                          icon={<EditOutlined />}
                          onClick={() => setEditMode(!editMode)}
                        >
                          {editMode ? '编辑模式' : '选择模式'}
                        </Button>
                        <Button
                          icon={<PlusOutlined />}
                          onClick={() => setNodeEditorVisible(true)}
                        >
                          添加节点
                        </Button>
                        <Button
                          icon={<LinkOutlined />}
                          onClick={() => setDependencyEditorVisible(true)}
                        >
                          添加依赖
                        </Button>
                      </Space>
                      {editMode && (
                        <Space>
                          <span>已选择中断节点: {disruptedNodes.size}</span>
                          <Button size="small" onClick={clearDisruptedNodes}>
                            清空选择
                          </Button>
                        </Space>
                      )}
                    </div>
                    <div style={{ flex: 1, minHeight: 0 }}>
                      <ForceGraph
                        nodes={graphNodes}
                        links={graphLinks}
                        simulationResult={getSimulationResultsArray()}
                        disruptedNodes={disruptedNodes}
                        animationStep={animationStep}
                        onNodeClick={handleNodeClick}
                        selectedNodeId={selectedNode}
                        editMode={editMode}
                        onNodeCreate={handleNodeCreate}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'simulation' && (
                  <div style={{ flex: 1, maxWidth: 400, marginRight: 24 }}>
                    <SimulationPanel
                      networkId={currentNetwork.id}
                      nodes={nodes}
                      onSimulationComplete={() => setActiveTab('results')}
                    />
                  </div>
                )}

                {activeTab === 'results' && (
                  <div style={{ flex: 1, maxWidth: 800 }}>
                    <ResultsPanel result={simulationResult} nodes={nodes} />
                  </div>
                )}

                {activeTab === 'optimization' && (
                  <div style={{ flex: 1, maxWidth: 800 }}>
                    <OptimizationPanel
                      networkId={currentNetwork.id}
                      onCompareClick={handleOptimizationCompare}
                      simulationResult={simulatedOptimizationResult}
                    />
                  </div>
                )}

                {activeTab === 'import' && (
                  <div style={{ flex: 1, maxWidth: 500 }}>
                    <ImportExportPanel
                      networkId={currentNetwork.id}
                      onImportSuccess={handleRefresh}
                    />
                  </div>
                )}
              </>
            )}
          </Content>
        </Layout>
      </Layout>

      <Modal
        title="创建供应链网络"
        open={createNetworkModal}
        onCancel={() => setCreateNetworkModal(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateNetwork}
        >
          <Form.Item
            name="name"
            label="网络名称"
            rules={[{ required: true, message: '请输入网络名称' }]}
          >
            <Input placeholder="例如：2024年全球供应链" />
          </Form.Item>
          <Form.Item
            name="description"
            label="描述"
          >
            <Input.TextArea placeholder="网络描述信息" rows={3} />
          </Form.Item>
          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setCreateNetworkModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">创建</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <NodeEditor
        visible={nodeEditorVisible}
        networkId={currentNetwork?.id || ''}
        onCancel={() => setNodeEditorVisible(false)}
        onSuccess={handleNodeCreateSuccess}
      />

      <DependencyEditor
        visible={dependencyEditorVisible}
        networkId={currentNetwork?.id || ''}
        nodes={nodes}
        onCancel={() => setDependencyEditorVisible(false)}
        onSuccess={handleDependencyCreateSuccess}
      />
    </Layout>
  );
};

export default MainPage;
