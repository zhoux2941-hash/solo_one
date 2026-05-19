import { useState, useEffect } from 'react'
import { Table, Button, Space, Card, Tag, Modal, message, Input, Form } from 'antd'
import { PlusOutlined, SearchOutlined, CheckOutlined, CloseOutlined, DollarOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useAuthStore } from '@/store/useAuthStore'
import api from '@/api/axios'

interface Order {
  id: number
  orderNo: string
  customerName: string
  totalAmount: number
  status: string
  createdAt: string
}

const Order = () => {
  const { t } = useTranslation()
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const response = await api.get('/orders')
      setOrders(response.data)
    } catch (error) {
      message.error('获取订单列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      DRAFT: { color: 'default', text: '草稿' },
      PENDING_APPROVAL: { color: 'orange', text: '待审批' },
      APPROVED: { color: 'blue', text: '已审批' },
      PROCESSING: { color: 'cyan', text: '处理中' },
      SHIPPED: { color: 'purple', text: '已发货' },
      DELIVERED: { color: 'geekblue', text: '已送达' },
      COMPLETED: { color: 'green', text: '已完成' },
      CANCELLED: { color: 'red', text: '已取消' },
      REFUNDED: { color: 'red', text: '已退款' },
    }
    const { color, text } = statusMap[status] || { color: 'default', text: status }
    return <Tag color={color}>{text}</Tag>
  }

  const handleCreate = async (values: any) => {
    try {
      await api.post('/orders', values)
      message.success('创建订单成功')
      setModalVisible(false)
      form.resetFields()
      fetchOrders()
    } catch (error) {
      message.error('创建订单失败')
    }
  }

  const handleApprove = (id: number) => {
    Modal.confirm({
      title: '确认审批',
      content: '确定要审批通过该订单吗？',
      onOk: async () => {
        try {
          await api.post(`/orders/${id}/approve`)
          message.success('审批成功')
          fetchOrders()
        } catch (error) {
          message.error('审批失败')
        }
      },
    })
  }

  const handleCancel = (id: number) => {
    Modal.confirm({
      title: '确认取消',
      content: '确定要取消该订单吗？',
      onOk: async () => {
        try {
          await api.post(`/orders/${id}/cancel`)
          message.success('取消成功')
          fetchOrders()
        } catch (error) {
          message.error('取消失败')
        }
      },
    })
  }

  const handleRefund = (id: number) => {
    Modal.confirm({
      title: '确认退款',
      content: '确定要退款该订单吗？',
      onOk: async () => {
        try {
          await api.post(`/orders/${id}/refund`)
          message.success('退款成功')
          fetchOrders()
        } catch (error) {
          message.error('退款失败')
        }
      },
    })
  }

  const columns = [
    { title: '订单号', dataIndex: 'orderNo', key: 'orderNo' },
    { title: '客户名称', dataIndex: 'customerName', key: 'customerName' },
    { title: '订单金额', dataIndex: 'totalAmount', key: 'totalAmount', render: (val: number) => `¥${val.toLocaleString()}` },
    { title: '状态', dataIndex: 'status', key: 'status', render: getStatusTag },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Order) => (
        <Space>
          {record.status === 'PENDING_APPROVAL' && (
            <Button type="primary" size="small" icon={<CheckOutlined />} onClick={() => handleApprove(record.id)}>
              {t('approve')}
            </Button>
          )}
          {record.status !== 'CANCELLED' && record.status !== 'REFUNDED' && record.status !== 'COMPLETED' && (
            <Button danger size="small" icon={<CloseOutlined />} onClick={() => handleCancel(record.id)}>
              {t('cancel_order')}
            </Button>
          )}
          {record.status === 'COMPLETED' && (
            <Button size="small" icon={<DollarOutlined />} onClick={() => handleRefund(record.id)}>
              {t('refund')}
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <>
      <Card
        title={t('order')}
        extra={
          <Space>
            <Input.Search placeholder={t('search')} style={{ width: 200 }} />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
              {t('create')}
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={orders}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="创建订单"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="customerName" label="客户名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="totalAmount" label="订单金额" rules={[{ required: true }]}>
            <Input.Number style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default Order
