import React, { useState, useEffect } from 'react';
import {
  Tabs,
  Table,
  Button,
  Tag,
  Card,
  Row,
  Col,
  Form,
  Input,
  message,
  Space,
  Typography
} from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  EyeOutlined,
  DownloadOutlined,
  TagOutlined
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { reviewAPI, paperAPI, authAPI } from '../services/api';
import { ReviewTask, statusText, statusColor, decisionText, Recommendation } from '../types';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const ReviewerDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'reviews';
  const [reviews, setReviews] = useState<ReviewTask[]>([]);
  const [loading, setLoading] = useState(false);
  const { user, updateUser } = useAuth();
  const [profileForm] = Form.useForm();
  const navigate = useNavigate();

  const loadReviews = async () => {
    setLoading(true);
    try {
      const response = await reviewAPI.getMyReviews();
      setReviews(response.data);
    } catch (error) {
      message.error('加载审稿任务失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
    if (user) {
      profileForm.setFieldsValue({
        name: user.name,
        affiliation: user.affiliation,
        researchKeywords: user.researchKeywords?.join(', ')
      });
    }
  }, [user]);

  const handleDownloadPaper = async (filename: string, originalName: string) => {
    try {
      const response = await paperAPI.downloadPaper(filename);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', originalName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      message.error('下载失败');
    }
  };

  const handleUpdateProfile = async (values: {
    name: string;
    affiliation: string;
    researchKeywords?: string;
  }) => {
    try {
      const researchKeywords = values.researchKeywords
        ? values.researchKeywords.split(',').map((k) => k.trim()).filter((k) => k)
        : undefined;

      const response = await authAPI.updateProfile({
        name: values.name,
        affiliation: values.affiliation,
        researchKeywords
      });
      updateUser(response.data);
      message.success('资料更新成功');
    } catch (error) {
      message.error('更新失败');
    }
  };

  const columns = [
    {
      title: '论文标题',
      dataIndex: 'paperTitle',
      key: 'paperTitle',
      render: (text: string, record: ReviewTask) => (
        <Button
          type="link"
          onClick={() => navigate(`/reviewer/reviews/${record.id}`)}
          style={{ padding: 0 }}
        >
          {text}
        </Button>
      )
    },
    {
      title: '关键词',
      dataIndex: 'paperKeywords',
      key: 'paperKeywords',
      render: (keywords: string[]) => (
        <div className="paper-tags">
          {keywords.map((kw, idx) => (
            <Tag key={idx} color="blue">
              {kw}
            </Tag>
          ))}
        </div>
      )
    },
    {
      title: '作者',
      dataIndex: 'authorName',
      key: 'authorName'
    },
    {
      title: '论文状态',
      dataIndex: 'paperStatus',
      key: 'paperStatus',
      render: (status: string) => (
        <Tag color={statusColor[status as keyof typeof statusColor]}>
          {statusText[status as keyof typeof statusText]}
        </Tag>
      )
    },
    {
      title: '审稿状态',
      key: 'reviewStatus',
      render: (_: any, record: ReviewTask) =>
        record.completed ? (
          <Tag color="green">已完成</Tag>
        ) : (
          <Tag color="orange">待审稿</Tag>
        )
    },
    {
      title: '您的建议',
      dataIndex: 'recommendation',
      key: 'recommendation',
      render: (rec: Recommendation | null) =>
        rec ? <Text>{decisionText[rec]}</Text> : <Text type="secondary">未填写</Text>
    },
    {
      title: '分配时间',
      dataIndex: 'assignedAt',
      key: 'assignedAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: ReviewTask) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/reviewer/reviews/${record.id}`)}
          >
            {record.completed ? '查看' : '审稿'}
          </Button>
          <Button
            type="link"
            icon={<DownloadOutlined />}
            onClick={() => handleDownloadPaper(record.originalFileName, record.originalFileName)}
          >
            下载
          </Button>
        </Space>
      )
    }
  ];

  const stats = [
    { title: '总审稿任务', value: reviews.length, icon: <FileTextOutlined /> },
    { title: '待审稿', value: reviews.filter((r) => !r.completed).length, icon: <ClockCircleOutlined />, color: '#fa8c16' },
    { title: '已完成', value: reviews.filter((r) => r.completed).length, icon: <CheckCircleOutlined />, color: '#52c41a' }
  ];

  return (
    <Layout title="学术会议投稿系统 - 审稿人端">
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {stats.map((stat, idx) => (
          <Col xs={12} sm={8} key={idx}>
            <div className="stat-card">
              <div style={{ fontSize: '28px', color: stat.color || '#667eea', marginBottom: '8px' }}>
                {stat.icon}
              </div>
              <div className="stat-value" style={{ color: stat.color || '#667eea' }}>
                {stat.value}
              </div>
              <div className="stat-label">{stat.title}</div>
            </div>
          </Col>
        ))}
      </Row>

      <Card className="card-shadow">
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setSearchParams({ tab: key })}
          items={[
            {
              key: 'reviews',
              label: '我的审稿任务',
              children: (
                <>
                  <Title level={4} style={{ marginBottom: '16px' }}>
                    我的审稿任务
                  </Title>
                  <Table
                    columns={columns}
                    dataSource={reviews}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                  />
                </>
              )
            },
            {
              key: 'profile',
              label: '个人资料',
              children: (
                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                  <Title level={4} style={{ marginBottom: '24px' }}>
                    个人资料
                  </Title>
                  <Form
                    form={profileForm}
                    layout="vertical"
                    onFinish={handleUpdateProfile}
                    size="large"
                  >
                    <Form.Item
                      name="name"
                      label="姓名"
                      rules={[{ required: true, message: '请输入姓名' }]}
                    >
                      <Input placeholder="请输入姓名" />
                    </Form.Item>
                    <Form.Item
                      name="affiliation"
                      label="所属单位"
                      rules={[{ required: true, message: '请输入所属单位' }]}
                    >
                      <Input placeholder="请输入学校/机构名称" />
                    </Form.Item>
                    <Form.Item
                      name="researchKeywords"
                      label="研究领域关键词"
                      tooltip="请输入您的研究领域关键词，多个关键词用逗号分隔"
                      rules={[{ required: true, message: '请输入研究领域关键词' }]}
                    >
                      <Input
                        prefix={<TagOutlined />}
                        placeholder="例如：机器学习, 深度学习, 计算机视觉"
                      />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit">
                        保存修改
                      </Button>
                    </Form.Item>
                  </Form>
                </div>
              )
            }
          ]}
        />
      </Card>
    </Layout>
  );
};

export default ReviewerDashboard;
