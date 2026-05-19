import { useState, useEffect } from 'react'
import { Table, Button, Space, Card, Tag, Modal, message, Input, Form } from 'antd'
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import api from '@/api/axios'

interface Product {
  id: number
  productName: string
  skuCode: string
  category: string
  brand: string
  salePrice: number
  stockQuantity: number
  status: string
}

const Product = () => {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await api.get('/products')
      setProducts(response.data)
    } catch (error) {
      message.error('获取商品列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleCreate = async (values: any) => {
    try {
      await api.post('/products', values)
      message.success('创建商品成功')
      setModalVisible(false)
      form.resetFields()
      fetchProducts()
    } catch (error) {
      message.error('创建商品失败')
    }
  }

  const handleDelete = (id: number) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除该商品吗？',
      onOk: async () => {
        try {
          await api.delete(`/products/${id}`)
          message.success('删除成功')
          fetchProducts()
        } catch (error) {
          message.error('删除失败')
        }
      },
    })
  }

  const columns = [
    { title: '商品名称', dataIndex: 'productName', key: 'productName' },
    { title: 'SKU编码', dataIndex: 'skuCode', key: 'skuCode' },
    { title: '分类', dataIndex: 'category', key: 'category' },
    { title: '品牌', dataIndex: 'brand', key: 'brand' },
    { title: '售价', dataIndex: 'salePrice', key: 'salePrice', render: (val: number) => `¥${val.toLocaleString()}` },
    { title: '库存', dataIndex: 'stockQuantity', key: 'stockQuantity', render: (val: number) => <Tag color={val > 10 ? 'green' : val > 0 ? 'orange' : 'red'}>{val}</Tag> },
    { title: '状态', dataIndex: 'status', key: 'status', render: (val: string) => <Tag color={val === 'ACTIVE' ? 'green' : 'red'}>{val === 'ACTIVE' ? '上架' : '下架'}</Tag> },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Product) => (
        <Space>
          <Button size="small" icon={<EditOutlined />}>{t('edit')}</Button>
          <Button danger size="small" icon={<DeleteOutlined />} onClick={() => handleDelete(record.id)}>{t('delete')}</Button>
        </Space>
      ),
    },
  ]

  return (
    <>
      <Card
        title={t('product')}
        extra={
          <Space>
            <Input.Search placeholder={t('search')} style={{ width: 200 }} />
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
              {t('add')}
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={products}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      <Modal
        title="新增商品"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="productName" label="商品名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="skuCode" label="SKU编码" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="分类">
            <Input />
          </Form.Item>
          <Form.Item name="brand" label="品牌">
            <Input />
          </Form.Item>
          <Form.Item name="salePrice" label="售价">
            <Input.Number style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="stockQuantity" label="库存">
            <Input.Number style={{ width: '100%' }} min={0} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  )
}

export default Product
