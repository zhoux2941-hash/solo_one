import React, { useState } from 'react';
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
import { RollbackOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Option } = Select;

export default function VersionList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [appId, setAppId] = useState('demo-app');
  const [namespace, setNamespace] = useState('default');
  const [key, setKey] = useState('');
  const [environment, setEnvironment] = useState('dev');

  const fetchVersions = async () => {
    if (!key) return;
    setLoading(true);
    try {
      const res = await axios.get('/api/v1/configs/versions', {
        params: { app_id: appId, namespace, key, environment },
      });
      setData(res.data || []);
    } catch (e) {
      message.error('加载版本失败');
    }
    setLoading(false);
  };

  const handleRollback = async (record) => {
    try {
      await axios.post('/api/v1/configs/rollback', {
        app_id: record.app_id,
        namespace: record.namespace,
        key: record.key,
        environment: record.environment,
        version: record.version,
        operator: 'admin',
      });
      message.success('回滚成功');
      fetchVersions();
    } catch (e) {
      message.error('回滚失败');
    }
  };

  const columns = [
    {
      title: '版本号',
      dataIndex: 'version',
      key: 'version',
      width: 100,
      render: (v) => <Tag color="blue">v{v}</Tag>,
    },
    {
      title: '变更描述',
      dataIndex: 'change_desc',
      key: 'change_desc',
    },
    {
      title: '操作人',
      dataIndex: 'created_by',
      key: 'created_by',
      width: 100,
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Popconfirm
          title="确定回滚到此版本?"
          onConfirm={() => handleRollback(record)}
        >
          <Button type="link" icon={<RollbackOutlined />}>
            回滚
          </Button>
        </Popconfirm>
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
        <Input
          placeholder="配置Key"
          value={key}
          onChange={(e) => setKey(e.target.value)}
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
        <Button type="primary" onClick={fetchVersions}>
          查询
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
