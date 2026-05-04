import { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Tag,
  Space,
  Popconfirm,
  message,
  Drawer,
  Descriptions,
  Spin,
  Divider,
  Typography
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined
} from '@ant-design/icons'
import { parseRuleApi, logApi } from '../services/api'
import '../App.css'

const { Option } = Select
const { TextArea } = Input
const { Text, Title } = Typography

interface ParseRule {
  id: number
  ruleName: string
  logType: string
  ruleType: string
  pattern: string
  fieldMapping?: string
  sampleLog?: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

interface TestResult {
  totalLines: number
  parsedCount: number
  results: Array<{
    timestamp?: string
    level?: string
    message?: string
    rawLog: string
    logType: string
    fields?: Record<string, unknown>
  }>
}

const ParseRules = () => {
  const [loading, setLoading] = useState(false)
  const [rules, setRules] = useState<ParseRule[]>([])

  // 表单相关
  const [modalVisible, setModalVisible] = useState(false)
  const [editingRule, setEditingRule] = useState<ParseRule | null>(null)
  const [form] = Form.useForm()

  // 详情抽屉
  const [drawerVisible, setDrawerVisible] = useState(false)
  const [selectedRule, setSelectedRule] = useState<ParseRule | null>(null)

  // 测试弹窗
  const [testModalVisible, setTestModalVisible] = useState(false)
  const [testRule, setTestRule] = useState<ParseRule | null>(null)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [testLogText, setTestLogText] = useState('')

  const fetchRules = async () => {
    setLoading(true)
    try {
      const response = await parseRuleApi.getAllRules()
      if (response.data.success) {
        setRules(response.data.data)
      }
    } catch (error) {
      console.error('获取解析规则失败:', error)
      message.error('获取规则列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRules()
  }, [])

  // 新增
  const handleAdd = () => {
    setEditingRule(null)
    form.resetFields()
    form.setFieldsValue({
      logType: 'custom',
      ruleType: 'regex',
      isActive: true
    })
    setModalVisible(true)
  }

  // 编辑
  const handleEdit = (rule: ParseRule) => {
    setEditingRule(rule)
    form.setFieldsValue({
      ruleName: rule.ruleName,
      logType: rule.logType,
      ruleType: rule.ruleType,
      pattern: rule.pattern,
      fieldMapping: rule.fieldMapping || '',
      sampleLog: rule.sampleLog || '',
      isActive: rule.isActive
    })
    setModalVisible(true)
  }

  // 保存
  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      
      if (editingRule) {
        const response = await parseRuleApi.updateRule(editingRule.id, values)
        if (response.data.success) {
          message.success('规则更新成功')
          setModalVisible(false)
          fetchRules()
        } else {
          message.error('更新失败: ' + response.data.message)
        }
      } else {
        const response = await parseRuleApi.createRule(values)
        if (response.data.success) {
          message.success('规则创建成功')
          setModalVisible(false)
          fetchRules()
        } else {
          message.error('创建失败: ' + response.data.message)
        }
      }
    } catch (error) {
      console.error('保存规则失败:', error)
    }
  }

  // 删除
  const handleDelete = async (id: number) => {
    try {
      const response = await parseRuleApi.deleteRule(id)
      if (response.data.success) {
        message.success('规则删除成功')
        fetchRules()
      } else {
        message.error('删除失败: ' + response.data.message)
      }
    } catch (error) {
      console.error('删除规则失败:', error)
      message.error('删除失败')
    }
  }

  // 切换启用状态
  const toggleStatus = async (rule: ParseRule) => {
    try {
      const response = rule.isActive 
        ? await parseRuleApi.disableRule(rule.id)
        : await parseRuleApi.enableRule(rule.id)
      
      if (response.data.success) {
        message.success(rule.isActive ? '已禁用' : '已启用')
        fetchRules()
      } else {
        message.error('操作失败: ' + response.data.message)
      }
    } catch (error) {
      console.error('切换状态失败:', error)
      message.error('操作失败')
    }
  }

  // 查看详情
  const showDetail = (rule: ParseRule) => {
    setSelectedRule(rule)
    setDrawerVisible(true)
  }

  // 测试规则
  const handleTest = (rule: ParseRule) => {
    setTestRule(rule)
    setTestLogText(rule.sampleLog || '')
    setTestResult(null)
    setTestModalVisible(true)
  }

  // 执行测试
  const runTest = async () => {
    if (!testRule || !testLogText.trim()) {
      message.warning('请输入测试日志')
      return
    }

    setTesting(true)
    try {
      const response = await logApi.testParseRule(
        testLogText,
        testRule.logType,
        testRule.ruleType,
        testRule.pattern,
        testRule.fieldMapping
      )

      if (response.data.success) {
        setTestResult(response.data.data)
      } else {
        message.error('测试失败: ' + response.data.message)
      }
    } catch (error) {
      console.error('测试规则失败:', error)
      message.error('测试失败')
    } finally {
      setTesting(false)
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 60
    },
    {
      title: '规则名称',
      dataIndex: 'ruleName',
      key: 'ruleName',
      width: 150,
      render: (name: string) => <Text strong>{name}</Text>
    },
    {
      title: '日志类型',
      dataIndex: 'logType',
      key: 'logType',
      width: 120,
      render: (type: string) => <Tag color="blue">{type.toUpperCase()}</Tag>
    },
    {
      title: '规则类型',
      dataIndex: 'ruleType',
      key: 'ruleType',
      width: 100,
      render: (type: string) => (
        <Tag color={type === 'regex' ? 'green' : 'orange'}>
          {type.toUpperCase()}
        </Tag>
      )
    },
    {
      title: '解析模式',
      dataIndex: 'pattern',
      key: 'pattern',
      ellipsis: true,
      render: (pattern: string) => (
        <code style={{ 
          background: '#f5f5f5', 
          padding: '2px 6px', 
          borderRadius: 4,
          fontSize: 12,
          color: '#666'
        }}>
          {pattern}
        </code>
      )
    },
    {
      title: '状态',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 100,
      render: (isActive: boolean, record: ParseRule) => (
        <Switch
          checked={isActive}
          checkedChildren="启用"
          unCheckedChildren="禁用"
          onChange={() => toggleStatus(record)}
        />
      )
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      fixed: 'right',
      render: (_: unknown, record: ParseRule) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => handleTest(record)}
          >
            测试
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => showDetail(record)}
          >
            详情
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定删除此规则吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div className="parse-rules">
      <Card>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={4} style={{ margin: 0 }}>解析规则管理</Title>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleAdd}
          >
            新增规则
          </Button>
        </div>

        <Spin spinning={loading}>
          <Table
            columns={columns}
            dataSource={rules}
            rowKey="id"
            scroll={{ x: 1000 }}
            pagination={{
              showTotal: (total) => `共 ${total} 条规则`,
              defaultPageSize: 10
            }}
          />
        </Spin>
      </Card>

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingRule ? '编辑解析规则' : '新增解析规则'}
        open={modalVisible}
        onOk={handleSave}
        onCancel={() => setModalVisible(false)}
        width={700}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
          className="rule-form"
        >
          <Form.Item
            name="ruleName"
            label="规则名称"
            rules={[{ required: true, message: '请输入规则名称' }]}
          >
            <Input placeholder="例如: Nginx 访问日志解析" />
          </Form.Item>

          <Form.Item
            name="logType"
            label="日志类型"
            rules={[{ required: true, message: '请选择日志类型' }]}
          >
            <Select>
              <Option value="nginx">Nginx</Option>
              <Option value="apache">Apache</Option>
              <Option value="json_lines">JSON Lines</Option>
              <Option value="custom">自定义</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="ruleType"
            label="规则类型"
            rules={[{ required: true, message: '请选择规则类型' }]}
          >
            <Select>
              <Option value="regex">正则表达式</Option>
              <Option value="grok">Grok 模式</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="pattern"
            label="解析模式"
            rules={[{ required: true, message: '请输入解析模式' }]}
            help={
              <Text type="secondary">
                正则示例: ^(\S+) (\S+) (\S+) \[([^\]]+)\] "(\S+) (\S+) (\S+)" (\d+) (\d+)$
                <br />
                Grok 示例: %{COMBINEDAPACHELOG}
              </Text>
            }
          >
            <TextArea
              rows={3}
              placeholder="输入正则表达式或 Grok 模式"
              style={{ fontFamily: 'Consolas, Monaco, monospace' }}
            />
          </Form.Item>

          <Form.Item
            name="fieldMapping"
            label="字段映射 (JSON)"
            help={
              <Text type="secondary">
                可选，用于将正则捕获组映射到字段名。例如: {"group1": "ip", "group2": "timestamp"}
              </Text>
            }
          >
            <TextArea
              rows={2}
              placeholder='{"group1": "timestamp", "group2": "level"}'
              style={{ fontFamily: 'Consolas, Monaco, monospace' }}
            />
          </Form.Item>

          <Form.Item
            name="sampleLog"
            label="示例日志"
            help={<Text type="secondary">可选，用于测试规则的示例日志</Text>}
          >
            <TextArea
              rows={3}
              placeholder="输入示例日志行..."
              style={{ fontFamily: 'Consolas, Monaco, monospace' }}
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="启用状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 详情抽屉 */}
      <Drawer
        title="规则详情"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={500}
      >
        {selectedRule && (
          <div>
            <Descriptions bordered column={1}>
              <Descriptions.Item label="ID">{selectedRule.id}</Descriptions.Item>
              <Descriptions.Item label="规则名称">{selectedRule.ruleName}</Descriptions.Item>
              <Descriptions.Item label="日志类型">
                <Tag color="blue">{selectedRule.logType.toUpperCase()}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="规则类型">
                <Tag color={selectedRule.ruleType === 'regex' ? 'green' : 'orange'}>
                  {selectedRule.ruleType.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {selectedRule.isActive ? (
                  <Tag icon={<CheckCircleOutlined />} color="success">已启用</Tag>
                ) : (
                  <Tag icon={<CloseCircleOutlined />} color="default">已禁用</Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="解析模式">
                <pre className="json-view">{selectedRule.pattern}</pre>
              </Descriptions.Item>
              {selectedRule.fieldMapping && (
                <Descriptions.Item label="字段映射">
                  <pre className="json-view">{selectedRule.fieldMapping}</pre>
                </Descriptions.Item>
              )}
              {selectedRule.sampleLog && (
                <Descriptions.Item label="示例日志">
                  <pre className="json-view">{selectedRule.sampleLog}</pre>
                </Descriptions.Item>
              )}
              {selectedRule.createdAt && (
                <Descriptions.Item label="创建时间">
                  {new Date(selectedRule.createdAt).toLocaleString()}
                </Descriptions.Item>
              )}
              {selectedRule.updatedAt && (
                <Descriptions.Item label="更新时间">
                  {new Date(selectedRule.updatedAt).toLocaleString()}
                </Descriptions.Item>
              )}
            </Descriptions>
          </div>
        )}
      </Drawer>

      {/* 测试弹窗 */}
      <Modal
        title="测试解析规则"
        open={testModalVisible}
        onCancel={() => setTestModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setTestModalVisible(false)}>
            关闭
          </Button>,
          <Button
            key="test"
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={runTest}
            loading={testing}
            disabled={!testLogText.trim()}
          >
            运行测试
          </Button>
        ]}
        width={800}
      >
        {testRule && (
          <div>
            <Alert
              message={`当前规则: ${testRule.ruleName} (${testRule.logType.toUpperCase()} / ${testRule.ruleType.toUpperCase()})`}
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />

            <Divider>测试日志</Divider>
            <TextArea
              value={testLogText}
              onChange={e => setTestLogText(e.target.value)}
              rows={6}
              placeholder="输入要测试的日志内容，每行一条..."
              style={{ fontFamily: 'Consolas, Monaco, monospace' }}
            />

            {testResult && (
              <div style={{ marginTop: 24 }}>
                <Divider>测试结果</Divider>
                
                <Alert
                  message={`解析完成: 共 ${testResult.totalLines} 行，成功解析 ${testResult.parsedCount} 行`}
                  type={testResult.parsedCount > 0 ? 'success' : 'warning'}
                  style={{ marginBottom: 16 }}
                />

                <div className="test-result-panel">
                  {testResult.results.map((result, index) => (
                    <div key={index} className="test-result-item">
                      <div style={{ fontWeight: 'bold', marginBottom: 8 }}>
                        第 {index + 1} 行 {result.level && <Tag>{result.level}</Tag>}
                      </div>
                      <Descriptions size="small" bordered column={1}>
                        <Descriptions.Item label="原始日志">
                          <code>{result.rawLog}</code>
                        </Descriptions.Item>
                        <Descriptions.Item label="解析时间">
                          {result.timestamp || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="日志级别">
                          {result.level || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="消息">
                          {result.message || '-'}
                        </Descriptions.Item>
                        {result.fields && Object.keys(result.fields).length > 0 && (
                          <Descriptions.Item label="额外字段">
                            <pre className="json-view">
                              {JSON.stringify(result.fields, null, 2)}
                            </pre>
                          </Descriptions.Item>
                        )}
                      </Descriptions>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ParseRules
