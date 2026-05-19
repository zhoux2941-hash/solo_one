import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Select,
  Input,
  Tag,
  Popconfirm,
  message,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

export default function ConfigList({ onEdit, onCreate }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [appId, setAppId] = useState('demo-app');
  const [namespace, setNamespace] = useState('default');
  const [environment, setEnvironment] = useState('dev');

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/configs', {
        params: { app_id: appId, namespace, environment },
      });
      setData(res.data || []);
    } catch (e) {
      message.error('加载配置失败');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConfigs();
  }, [appId, namespace, environment]);

  const handleDelete = async (record) => {
    try {
      await axios.delete('/api/v1/configs', {
        data: {
          app_id: record.app_id,
          namespace: record.namespace,
          key: record.key,
          environment: record.environment,
          operator: 'admin',
        },
      });
      message.success('删除成功');
      fetchConfigs();
    } catch (e) {
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: '应用ID',
      dataIndex: 'app_id',
      key: 'app_id',
      width: 120,
    },
    {
      title: '命名空间',
      dataIndex: 'namespace',
      key: 'namespace',
      width: 100,
    },
    {
      title: '配置Key',
      dataIndex: 'key',
      key: 'key',
      width: 150,
    },
    {
      title: '格式',
      dataIndex: 'format',
      key: 'format',
      width: 80,
      render: (f) => <Tag color="blue">{f}</Tag>,
    },
    {
      title: '环境',
      dataIndex: 'environment',
      key: 'environment',
      width: 80,
      render: (env) => {
        const colors = { dev: 'green', test: 'orange', prod: 'red' };
        return <Tag color={colors[env]}>{env}</Tag>;
      },
    },
    {
      title: '版本',
      dataIndex: 'version',
      key: 'version',
      width: 70,
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => onEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除?"
            onConfirm={() => handleDelete(record)}
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <Input
          placeholder="应用ID"
          value={appId}
          onChange={(e) => setAppId(e.target.value)}
          style={{ width: 150 }}
        />
        <Input
          placeholder="命名空间"
          value={namespace}
          onChange={(e) => setNamespace(e.target.value)}
          style={{ width: 150 }}
        />
        <Select
          value={environment}
          onChange={setEnvironment}
          style={{ width: 120 }}
        >
          <Option value="dev">开发环境</Option>
          <Option value="test">测试环境</Option>
          <Option value="prod">生产环境</Option>
        </Select>
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          新建配置
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10 }}
      />
    </div>
  );
}
