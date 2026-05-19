import React, { useState } from 'react';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Switch,
  Slider,
  Space,
  Tag,
  message,
} from 'antd';
import axios from 'axios';

const { Option } = Select;
const { TextArea } = Input;

export default function GrayRelease() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [grayType, setGrayType] = useState('ip');

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      await axios.post('/api/v1/gray', {
        config_id: values.config_id,
        gray_value: values.gray_value,
        gray_type: values.gray_type,
        ip_list: values.ip_list ? values.ip_list.split(',').map(s => s.trim()) : [],
        tags: values.tags ? values.tags.split(',').map(s => s.trim()) : [],
        percentage: values.percentage || 0,
        is_enabled: values.is_enabled,
        operator: 'admin',
      });

      message.success('灰度策略创建成功');
      form.resetFields();
    } catch (e) {
      message.error('操作失败');
    }
    setLoading(false);
  };

  return (
    <div>
      <Card title="灰度发布配置">
        <Form form={form} layout="vertical" style={{ maxWidth: 800 }}>
          <Form.Item
            label="配置ID"
            name="config_id"
            rules={[{ required: true }]}
          >
            <Input placeholder="请输入配置ID" />
          </Form.Item>

          <Form.Item
            label="灰度类型"
            name="gray_type"
            rules={[{ required: true }]}
            initialValue="ip"
          >
            <Select onChange={setGrayType}>
              <Option value="ip">按IP灰度</Option>
              <Option value="tag">按标签灰度</Option>
              <Option value="percentage">按比例灰度</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="灰度配置值"
            name="gray_value"
            rules={[{ required: true }]}
          >
            <TextArea
              rows={8}
              placeholder="请输入灰度发布的配置内容"
            />
          </Form.Item>

          {grayType === 'ip' && (
            <Form.Item
              label="灰度IP列表"
              name="ip_list"
              extra="多个IP用逗号分隔"
            >
              <Input placeholder="例如: 192.168.1.100,192.168.1.101" />
            </Form.Item>
          )}

          {grayType === 'tag' && (
            <Form.Item
              label="灰度标签"
              name="tags"
              extra="多个标签用逗号分隔"
            >
              <Input placeholder="例如: beta,test" />
            </Form.Item>
          )}

          {grayType === 'percentage' && (
            <Form.Item
              label="灰度比例"
              name="percentage"
              initialValue={10}
            >
              <Slider
                min={0}
                max={100}
                marks={{
                  0: '0%',
                  25: '25%',
                  50: '50%',
                  75: '75%',
                  100: '100%',
                }}
              />
            </Form.Item>
          )}

          <Form.Item
            label="启用状态"
            name="is_enabled"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <Button type="primary" onClick={handleSubmit} loading={loading}>
              创建灰度策略
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="灰度类型说明" style={{ marginTop: 24 }}>
        <Space direction="vertical" size="middle">
          <div>
            <Tag color="blue">按IP灰度</Tag>
            <span>指定特定的IP地址获取灰度配置，适合内部测试</span>
          </div>
          <div>
            <Tag color="green">按标签灰度</Tag>
            <span>根据客户端标签进行灰度，适合按用户群划分</span>
          </div>
          <div>
            <Tag color="orange">按比例灰度</Tag>
            <span>根据客户端IP哈希值按比例灰度，适合渐进式发布</span>
          </div>
        </Space>
      </Card>
    </div>
  );
}
