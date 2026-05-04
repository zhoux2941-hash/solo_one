import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Input, InputNumber, Button, Space, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { SupplyNode, CreateNodeData, NodeType } from '@/types';
import { networkApi } from '@/api';

interface NodeEditorProps {
  visible: boolean;
  networkId: string;
  onCancel: () => void;
  onSuccess: () => void;
  initialPosition?: { x: number; y: number };
}

const NODE_TYPE_OPTIONS = [
  { value: 'supplier', label: '供应商 (Supplier)' },
  { value: 'manufacturer', label: '制造商 (Manufacturer)' },
  { value: 'warehouse', label: '仓库 (Warehouse)' },
  { value: 'distributor', label: '分销商 (Distributor)' },
  { value: 'retailer', label: '零售商 (Retailer)' },
  { value: 'customer', label: '客户 (Customer)' },
];

export const NodeEditor: React.FC<NodeEditorProps> = ({
  visible,
  networkId,
  onCancel,
  onSuccess,
  initialPosition,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      form.resetFields();
      form.setFieldsValue({
        risk_score: 0.0,
        node_type: 'supplier',
      });
    }
  }, [visible, form]);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const data: CreateNodeData = {
        name: values.name,
        node_type: values.node_type as NodeType,
        description: values.description,
        risk_score: values.risk_score || 0,
        attributes: {},
      };

      if (values.latitude !== undefined) {
        data.latitude = values.latitude;
      }
      if (values.longitude !== undefined) {
        data.longitude = values.longitude;
      }

      await networkApi.createNode(networkId, data);
      message.success('节点创建成功');
      onSuccess();
      form.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '创建节点失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <PlusOutlined />
          <span>创建新节点</span>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={500}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="name"
          label="节点名称"
          rules={[{ required: true, message: '请输入节点名称' }]}
        >
          <Input placeholder="例如：供应商A" />
        </Form.Item>

        <Form.Item
          name="node_type"
          label="节点类型"
          rules={[{ required: true, message: '请选择节点类型' }]}
        >
          <Select options={NODE_TYPE_OPTIONS} placeholder="请选择节点类型" />
        </Form.Item>

        <Form.Item
          name="description"
          label="描述"
        >
          <Input.TextArea placeholder="节点描述信息" rows={3} />
        </Form.Item>

        <Form.Item
          name="risk_score"
          label="基础风险评分 (0-1)"
          help="0表示无风险，1表示最高风险"
        >
          <InputNumber
            min={0}
            max={1}
            step={0.01}
            style={{ width: '100%' }}
            placeholder="例如：0.2"
          />
        </Form.Item>

        <Form.Item label="地理位置 (可选)">
          <Space>
            <Form.Item name="latitude" noStyle>
              <InputNumber
                placeholder="纬度"
                style={{ width: 150 }}
                min={-90}
                max={90}
              />
            </Form.Item>
            <Form.Item name="longitude" noStyle>
              <InputNumber
                placeholder="经度"
                style={{ width: 150 }}
                min={-180}
                max={180}
              />
            </Form.Item>
          </Space>
        </Form.Item>

        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel}>取消</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              创建节点
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default NodeEditor;
