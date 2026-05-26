import React, { useState, useEffect } from 'react';
import {
  Tabs,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Upload,
  Tag,
  Progress,
  Card,
  Row,
  Col,
  Statistic,
  message,
  Space,
  Descriptions,
  Rate,
  Typography
} from 'antd';
import {
  UploadOutlined,
  EyeOutlined,
  DownloadOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { paperAPI, authAPI } from '../services/api';
import { Paper, statusText, statusColor, decisionText } from '../types';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const AuthorDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'papers';
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitModalVisible, setSubmitModalVisible] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [form] = Form.useForm();
  const { user, updateUser } = useAuth();
  const [profileForm] = Form.useForm();
  const navigate = useNavigate();

  const loadPapers = async () => {
    setLoading(true);
    try {
      const response = await paperAPI.getMyPapers();
      setPapers(response.data);
    } catch (error) {
      message.error('加载论文列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPapers();
    if (user) {
      profileForm.setFieldsValue({
        name: user.name,
        affiliation: user.affiliation,
        researchKeywords: user.researchKeywords?.join(', ')
      });
    }
  }, [user]);

  const handleSubmitPaper = async (values: { title: string; abstract: string; keywords: string }) => {
    if (fileList.length === 0) {
      message.error('请上传PDF文件');
      return;
    }

    const formData = new FormData();
    formData.append('title', values.title);
    formData.append('abstract', values.abstract);
    formData.append('keywords', values.keywords);
    formData.append('file', fileList[0] as any);

    setLoading(true);
    try {
      await paperAPI.submit(formData);
      message.success('论文提交成功');
      setSubmitModalVisible(false);
      form.resetFields();
      setFileList([]);
      loadPapers();
    } catch (error: any) {
      message.error(error.response?.data?.message || '提交失败');
    } finally {
      setLoading(false);
    }
  };

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

  const handleUpdateProfile = async (values: { name: string; affiliation: string; researchKeywords?: string }) => {
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

  const uploadProps: UploadProps = {
    fileList,
    onChange: ({ fileList: newFileList }) => setFileList(newFileList),
    beforeUpload: () => false,
    accept: '.pdf',
    maxCount: 1
  };

  const columns = [
    {
      title: '论文标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Paper) => (
        <Button
          type="link"
          onClick={() => navigate(`/author/papers/${record.id}`)}
          style={{ padding: 0 }}
        >
          {text}
        </Button>
      )
    },
    {
      title: '关键词',
      dataIndex: 'keywords',
      key: 'keywords',
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
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColor[status as keyof typeof statusColor]}>
          {statusText[status as keyof typeof statusText]}
        </Tag>
      )
    },
    {
      title: '审稿进度',
      key: 'progress',
      render: (_: any, record: Paper) => (
        <div className="progress-section">
          <div className="progress-label">
            <span>{record.completedReviews}/{record.totalReviews} 位审稿人已完成</span>
            <span>{record.reviewProgress}%</span>
          </div>
          <Progress
            percent={record.reviewProgress}
            size="small"
            showInfo={false}
            strokeColor="#667eea"
          />
        </div>
      )
    },
    {
      title: '最终决定',
      dataIndex: 'finalDecision',
      key: 'finalDecision',
      render: (decision: string | null) =>
        decision ? (
          <Tag color={decision === 'accept' ? 'green' : decision === 'reject' ? 'red' : 'orange'}>
            {decisionText[decision]}
          </Tag>
        ) : (
          <Text type="secondary">待决定</Text>
        )
    },
    {
      title: '提交时间',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: Paper) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/author/papers/${record.id}`)}
          >
            查看
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
    { title: '总投稿数', value: papers.length, icon: <FileTextOutlined /> },
    { title: '审稿中', value: papers.filter(p => p.status === 'reviewing').length, icon: <ClockCircleOutlined />, color: '#1890ff' },
    { title: '已录用', value: papers.filter(p => p.status === 'accepted').length, icon: <CheckCircleOutlined />, color: '#52c41a' },
    { title: '邮件通知', value: papers.filter(p => p.emailSent).length, icon: <CheckCircleOutlined />, color: '#722ed1' }
  ];

  return (
    <Layout title="学术会议投稿系统 - 作者端">
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        {stats.map((stat, idx) => (
          <Col xs={12} sm={6} key={idx}>
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
              key: 'papers',
              label: '我的投稿',
              children: (
                <>
                  <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
                    <Title level={4} style={{ margin: 0 }}>
                      我的投稿论文
                    </Title>
                    <Button
                      type="primary"
                      icon={<UploadOutlined />}
                      onClick={() => setSubmitModalVisible(true)}
                    >
                      提交新论文
                    </Button>
                  </div>
                  <Table
                    columns={columns}
                    dataSource={papers}
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

      <Modal
        title="提交新论文"
        open={submitModalVisible}
        onCancel={() => {
          setSubmitModalVisible(false);
          form.resetFields();
          setFileList([]);
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmitPaper}
          size="large"
        >
          <Form.Item
            name="title"
            label="论文标题"
            rules={[{ required: true, message: '请输入论文标题' }]}
          >
            <Input placeholder="请输入论文标题" />
          </Form.Item>

          <Form.Item
            name="abstract"
            label="摘要"
            rules={[{ required: true, message: '请输入摘要' }]}
          >
            <TextArea rows={4} placeholder="请输入论文摘要" />
          </Form.Item>

          <Form.Item
            name="keywords"
            label="关键词"
            tooltip="多个关键词用逗号分隔"
            rules={[{ required: true, message: '请输入关键词' }]}
          >
            <Input placeholder="例如：机器学习, 深度学习, 计算机视觉" />
          </Form.Item>

          <Form.Item
            label="上传PDF文件"
            required
          >
            <Upload {...uploadProps}>
              <Button icon={<UploadOutlined />}>选择PDF文件</Button>
            </Upload>
            <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
              仅支持PDF格式，最大10MB
            </Text>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setSubmitModalVisible(false);
                  form.resetFields();
                  setFileList([]);
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                提交
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default AuthorDashboard;
