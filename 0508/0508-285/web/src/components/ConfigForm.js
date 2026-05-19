import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, message } from 'antd';
import axios from 'axios';

const { Option } = Select;
const { TextArea } = Input;

export default function ConfigForm({ visible, config, onClose, onSuccess }) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (config) {
      form.setFieldsValue({
        app_id: config.app_id,
        namespace: config.namespace,
        key: config.key,
        value: config.value,
        format: config.format,
        environment: config.environment,
      });
    } else {
      form.resetFields();
    }
  }, [config, visible]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      if (config) {
        await axios.put('/api/v1/configs', {
          ...values,
          operator: 'admin',
          change_desc: '更新配置',
        });
      } else {
        await axios.post('/api/v1/configs', {
          ...values,
          labels: {},
          operator: 'admin',
        });
      }

      message.success(config ? '更新成功' : '创建成功');
      onSuccess();
    } catch (e) {
      message.error('操作失败');
    }
    setLoading(false);
  };

  return (
    <Modal
      title={config ? '编辑配置' : '新建配置'}
      open={visible}
      onOk={handleSubmit}
      onCancel={onClose}
      confirmLoading={loading}
      width={700}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          label="应用ID"
          name="app_id"
          rules={[{ required: true }]}
        >
          <Input placeholder="例如: demo-app" />
        </Form.Item>

        <Form.Item
          label="命名空间"
          name="namespace"
          rules={[{ required: true }]}
        >
          <Input placeholder="例如: default" />
        </Form.Item>

        <Form.Item
          label="配置Key"
          name="key"
          rules={[{ required: true }]}
        >
          <Input placeholder="例如: database" />
        </Form.Item>

        <Form.Item
          label="环境"
          name="environment"
          rules={[{ required: true }]}
        >
          <Select>
            <Option value="dev">开发环境</Option>
            <Option value="test">测试环境</Option>
            <Option value="prod">生产环境</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="配置格式"
          name="format"
          rules={[{ required: true }]}
        >
          <Select>
            <Option value="yaml">YAML</Option>
            <Option value="json">JSON</Option>
            <Option value="properties">Properties</Option>
          </Select>
        </Form.Item>

        <Form.Item
          label="配置内容"
          name="value"
          rules={[{ required: true }]}
        >
          <TextArea
            rows={12}
            placeholder={`YAML示例:\nhost: localhost\nport: 3306`}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
