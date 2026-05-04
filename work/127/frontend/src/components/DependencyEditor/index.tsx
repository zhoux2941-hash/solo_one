import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, InputNumber, Button, Space, message } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import type { SupplyNode, CreateDependencyData } from '@/types';
import { networkApi } from '@/api';

interface DependencyEditorProps {
  visible: boolean;
  networkId: string;
  nodes: SupplyNode[];
  onCancel: () => void;
  onSuccess: () => void;
}

export const DependencyEditor: React.FC<DependencyEditorProps> = ({
  visible,
  networkId,
  nodes,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const nodeOptions = nodes.map((node) => ({
    value: node.id,
    label: `${node.name} (${node.node_type})`,
  }));

  useEffect(() => {
    if (visible) {
      form.resetFields();
      form.setFieldsValue({
        dependency_strength: 0.5,
        propagation_probability: 0.3,
      });
    }
  }, [visible, form]);

  const handleSubmit = async (values: any) => {
    if (values.source_node_id === values.target_node_id) {
      message.error('源节点和目标节点不能相同');
      return;
    }

    setLoading(true);
    try {
      const data: CreateDependencyData = {
        source_node_id: values.source_node_id,
        target_node_id: values.target_node_id,
        dependency_strength: values.dependency_strength,
        propagation_probability: values.propagation_probability,
        lead_time_days: values.lead_time_days,
        volume_percentage: values.volume_percentage,
      };

      await networkApi.createDependency(networkId, data);
      message.success('依赖关系创建成功');
      onSuccess();
      form.resetFields();
    } catch (error: any) {
      message.error(error.response?.data?.detail || '创建依赖关系失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <LinkOutlined />
          <span>创建依赖关系</span>
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
          name="source_node_id"
          label="源节点 (依赖方)"
          rules={[{ required: true, message: '请选择源节点' }]}
          help="表示该节点依赖于目标节点"
        >
          <Select
            options={nodeOptions}
            placeholder="选择依赖节点"
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          name="target_node_id"
          label="目标节点 (被依赖方)"
          rules={[{ required: true, message: '请选择目标节点' }]}
          help="表示该节点被源节点依赖"
        >
          <Select
            options={nodeOptions}
            placeholder="选择被依赖节点"
            showSearch
            optionFilterProp="label"
          />
        </Form.Item>

        <Form.Item
          name="dependency_strength"
          label="依赖强度 (0-1)"
          help="值越高表示依赖越强，目标节点故障对源节点影响越大"
        >
          <InputNumber
            min={0}
            max={1}
            step={0.1}
            style={{ width: '100%' }}
            placeholder="例如：0.8"
          />
        </Form.Item>

        <Form.Item
          name="propagation_probability"
          label="故障传播概率 (0-1)"
          help="目标节点发生故障时，传播到源节点的概率"
        >
          <InputNumber
            min={0}
            max={1}
            step={0.1}
            style={{ width: '100%' }}
            placeholder="例如：0.5"
          />
        </Form.Item>

        <Form.Item
          name="lead_time_days"
          label="前置时间 (天) (可选)"
        >
          <InputNumber
            min={0}
            style={{ width: '100%' }}
            placeholder="例如：7"
          />
        </Form.Item>

        <Form.Item
          name="volume_percentage"
          label="交易量占比 (可选) (0-1)"
        >
          <InputNumber
            min={0}
            max={1}
            step={0.1}
            style={{ width: '100%' }}
            placeholder="例如：0.3"
          />
        </Form.Item>

        <Form.Item>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel}>取消</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              创建依赖
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DependencyEditor;
