import { useState, useEffect } from 'react'
import { Card, Tabs, Table, Button, Space, Tag, Switch, Select, Form, Modal, message, Input, Tree, Alert } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, SafetyOutlined, SettingOutlined, ReloadOutlined, CheckCircleOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import api from '@/api/axios'
import { usePermissionStore, setupPermissionWebSocket } from '@/store/usePermissionStore'
import { useAuthStore } from '@/store/useAuthStore'

const System = () => {
  const { t, i18n } = useTranslation()
  const { user } = useAuthStore()
  const { permissions, permissionVersion, refreshPermissions } = usePermissionStore()

  const [activeTab, setActiveTab] = useState('roles')
  const [modalVisible, setModalVisible] = useState(false)
  const [permissionModalVisible, setPermissionModalVisible] = useState(false)
  const [selectedRole, setSelectedRole] = useState<any>(null)
  const [checkedPermissions, setCheckedPermissions] = useState<number[]>([])
  const [form] = Form.useForm()

  const [users] = useState([
    { id: 1, username: 'admin', realName: '系统管理员', role: '超级管理员', status: 'ACTIVE' },
    { id: 2, username: 'manager', realName: '张经理', role: '部门经理', status: 'ACTIVE' },
    { id: 3, username: 'user1', realName: '李四', role: '普通员工', status: 'ACTIVE' },
    { id: 4, username: 'user2', realName: '王五', role: '普通员工', status: 'INACTIVE' },
  ])

  const [roles] = useState([
    { id: 1, roleCode: 'ADMIN', roleName: '超级管理员', description: '拥有所有权限', userCount: 1 },
    { id: 2, roleCode: 'MANAGER', roleName: '部门经理', description: '管理部门订单', userCount: 1 },
    { id: 3, roleCode: 'STAFF', roleName: '普通员工', description: '创建和查看订单', userCount: 2 },
  ])

  // 权限树数据
  const permissionTreeData = [
    {
      key: 1,
      title: '仪表盘',
      children: [
        { key: 11, title: '查看统计' },
        { key: 12, title: '导出报表' },
      ],
    },
    {
      key: 2,
      title: '订单管理',
      children: [
        { key: 21, title: '查看订单' },
        { key: 22, title: '创建订单' },
        { key: 23, title: '审批订单' },
        { key: 24, title: '取消订单' },
        { key: 25, title: '退款订单' },
      ],
    },
    {
      key: 3,
      title: '商品管理',
      children: [
        { key: 31, title: '查看商品' },
        { key: 32, title: '创建商品' },
        { key: 33, title: '编辑商品' },
        { key: 34, title: '删除商品' },
        { key: 35, title: '库存管理' },
      ],
    },
    {
      key: 4,
      title: '财务管理',
      children: [
        { key: 41, title: '查看报表' },
        { key: 42, title: '导出Excel' },
        { key: 43, title: '导出PDF' },
      ],
    },
    {
      key: 5,
      title: '系统管理',
      children: [
        { key: 51, title: '用户管理' },
        { key: 52, title: '角色管理' },
        { key: 53, title: '权限管理' },
        { key: 54, title: '系统设置' },
      ],
    },
  ]

  // 初始化权限监听
  useEffect(() => {
    if (user) {
      setupPermissionWebSocket(user.tenantId, user.id)
      refreshPermissions()
    }
  }, [user])

  const handleEditRolePermissions = async (role: any) => {
    setSelectedRole(role)
    // 模拟加载角色当前权限
    setCheckedPermissions([21, 22, 31, 32, 41]) // 模拟已有权限
    setPermissionModalVisible(true)
  }

  const handleSaveRolePermissions = async () => {
    if (!selectedRole) return

    try {
      await api.put(`/roles/${selectedRole.id}/permissions`, {
        permissionIds: checkedPermissions,
      })

      message.success({
        content: '角色权限已更新！所有相关用户的权限将即时生效，无需重新登录。',
        duration: 4,
        icon: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
      })

      setPermissionModalVisible(false)

      // 刷新当前用户的权限（如果受影响）
      await refreshPermissions()
    } catch (error) {
      message.error('保存权限失败')
    }
  }

  const handleRefreshAllPermissions = async () => {
    try {
      await api.post('/permissions/admin/refresh-tenant')
      message.success('租户权限缓存已全部刷新')
      await refreshPermissions()
    } catch (error) {
      message.error('刷新失败')
    }
  }

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang)
    message.success(`语言已切换为 ${lang}`)
  }

  const userColumns = [
    { title: '用户名', dataIndex: 'username', key: 'username' },
    { title: '真实姓名', dataIndex: 'realName', key: 'realName' },
    { title: '角色', dataIndex: 'role', key: 'role' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => <Tag color={val === 'ACTIVE' ? 'green' : 'red'}>{val === 'ACTIVE' ? '正常' : '禁用'}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space>
          <Button size="small" icon={<EditOutlined />}>编辑</Button>
          <Button danger size="small" icon={<DeleteOutlined />}>删除</Button>
        </Space>
      ),
    },
  ]

  const roleColumns = [
    { title: '角色编码', dataIndex: 'roleCode', key: 'roleCode' },
    { title: '角色名称', dataIndex: 'roleName', key: 'roleName' },
    { title: '描述', dataIndex: 'description', key: 'description' },
    { title: '用户数', dataIndex: 'userCount', key: 'userCount' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            type="primary"
            icon={<EditOutlined />}
            onClick={() => handleEditRolePermissions(record)}
          >
            编辑权限
          </Button>
        </Space>
      ),
    },
  ]

  const tabItems = [
    {
      key: 'users',
      label: <span><UserOutlined /> 用户管理</span>,
      children: (
        <Card
          extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>新增用户</Button>}
        >
          <Table columns={userColumns} dataSource={users} rowKey="id" pagination={false} />
        </Card>
      ),
    },
    {
      key: 'roles',
      label: <span><SafetyOutlined /> 角色权限</span>,
      children: (
        <Card
          extra={
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleRefreshAllPermissions}>
                刷新权限缓存
              </Button>
              <Button type="primary" icon={<PlusOutlined />}>新增角色</Button>
            </Space>
          }
        >
          <Alert
            style={{ marginBottom: 16 }}
            message="权限即时生效机制"
            description="修改角色权限后，系统会自动清除相关用户的权限缓存，并通过WebSocket通知所有在线用户刷新权限，无需重新登录。"
            type="info"
            showIcon
          />
          <div style={{ marginBottom: 16 }}>
            <Tag color="blue">当前权限版本: {permissionVersion}</Tag>
            <Tag color="green">已加载权限数: {permissions.length}</Tag>
          </div>
          <Table columns={roleColumns} dataSource={roles} rowKey="id" pagination={false} />
        </Card>
      ),
    },
    {
      key: 'settings',
      label: <span><SettingOutlined /> 系统设置</span>,
      children: (
        <Card>
          <Form layout="vertical" style={{ maxWidth: 600 }}>
            <Form.Item label="系统名称">
              <Input defaultValue="企业级订单管理系统" />
            </Form.Item>
            <Form.Item label="语言设置">
              <Select defaultValue="zh" style={{ width: 200 }} onChange={changeLanguage}>
                <Select.Option value="zh">中文</Select.Option>
                <Select.Option value="en">English</Select.Option>
                <Select.Option value="ja">日本語</Select.Option>
              </Select>
            </Form.Item>
            <Form.Item label="开启实时权限刷新">
              <Switch defaultChecked />
            </Form.Item>
            <Form.Item label="权限检查间隔(秒)">
              <Input.Number min={10} max={3600} defaultValue={60} style={{ width: 200 }} />
            </Form.Item>
            <Form.Item>
              <Button type="primary">保存设置</Button>
            </Form.Item>
          </Form>
        </Card>
      ),
    },
  ]

  return (
    <>
      <Card title={t('system')}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Card>

      {/* 新增用户弹窗 */}
      <Modal
        title="新增用户"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="用户名" required>
            <Input />
          </Form.Item>
          <Form.Item label="真实姓名" required>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      {/* 角色权限编辑弹窗 */}
      <Modal
        title={`编辑角色权限 - ${selectedRole?.roleName || ''}`}
        open={permissionModalVisible}
        onCancel={() => setPermissionModalVisible(false)}
        onOk={handleSaveRolePermissions}
        width={700}
        okText="保存权限"
      >
        <Alert
          style={{ marginBottom: 16 }}
          message="注意"
          description="保存后，所有拥有此角色的用户权限将自动刷新，无需重新登录。"
          type="warning"
          showIcon
        />
        <div>
          <h4 style={{ marginBottom: 12 }}>选择权限:</h4>
          <Tree
            checkable
            checkedKeys={checkedPermissions}
            onCheck={(keys) => setCheckedPermissions(keys as number[])}
            treeData={permissionTreeData}
          />
        </div>
      </Modal>
    </>
  )
}

export default System
