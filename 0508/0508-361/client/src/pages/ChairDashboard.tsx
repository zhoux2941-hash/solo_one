import React, { useState, useEffect } from 'react';
import {
  Tabs,
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Tag,
  Progress,
  Card,
  Row,
  Col,
  Statistic,
  message,
  Space,
  Typography,
  Checkbox,
  List,
  Rate,
  Divider,
  Drawer,
  Descriptions,
  Tooltip
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  MailOutlined,
  EyeOutlined,
  UserAddOutlined,
  SendOutlined,
  SettingOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { chairAPI, paperAPI } from '../services/api';
import {
  Paper,
  ReviewerWithStats,
  MatchedReviewer,
  Statistics,
  EmailLog,
  statusText,
  statusColor,
  decisionText,
  FinalDecision
} from '../types';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;
const { Meta } = Card;

const ChairDashboard: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';
  const [papers, setPapers] = useState<Paper[]>([]);
  const [reviewers, setReviewers] = useState<ReviewerWithStats[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [currentPaper, setCurrentPaper] = useState<Paper | null>(null);
  const [matchedReviewers, setMatchedReviewers] = useState<MatchedReviewer[]>([]);
  const [selectedReviewers, setSelectedReviewers] = useState<number[]>([]);
  const [matchingLoading, setMatchingLoading] = useState(false);

  const [decisionModalVisible, setDecisionModalVisible] = useState(false);
  const [decisionForm] = Form.useForm();

  const [emailDrawerVisible, setEmailDrawerVisible] = useState(false);
  const [selectedEmailLog, setSelectedEmailLog] = useState<EmailLog | null>(null);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [papersRes, reviewersRes, statsRes, emailLogsRes] = await Promise.all([
        chairAPI.getAllPapers(),
        chairAPI.getReviewers(),
        chairAPI.getStatistics(),
        chairAPI.getEmailLogs()
      ]);
      setPapers(papersRes.data);
      setReviewers(reviewersRes.data);
      setStatistics(statsRes.data);
      setEmailLogs(emailLogsRes.data);
    } catch (error) {
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleMatchReviewers = async (paper: Paper) => {
    setCurrentPaper(paper);
    setMatchingLoading(true);
    setSelectedReviewers([]);
    try {
      const response = await chairAPI.matchReviewers(paper.id);
      setMatchedReviewers(response.data.matchedReviewers);
      setAssignModalVisible(true);
    } catch (error) {
      message.error('匹配审稿人失败');
    } finally {
      setMatchingLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    if (!currentPaper) return;
    setLoading(true);
    try {
      await chairAPI.autoAssignReviewers(currentPaper.id, 2, 3);
      message.success('自动分配成功');
      setAssignModalVisible(false);
      loadAllData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '分配失败');
    } finally {
      setLoading(false);
    }
  };

  const handleManualAssign = async () => {
    if (!currentPaper || selectedReviewers.length === 0) {
      message.error('请选择至少一位审稿人');
      return;
    }
    setLoading(true);
    try {
      await chairAPI.assignReviewer(currentPaper.id, selectedReviewers);
      message.success('分配成功');
      setAssignModalVisible(false);
      setSelectedReviewers([]);
      loadAllData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '分配失败');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDecisionModal = (paper: Paper) => {
    setCurrentPaper(paper);
    decisionForm.setFieldsValue({
      decision: paper.finalDecision,
      summary: paper.decisionSummary
    });
    setDecisionModalVisible(true);
  };

  const handleSetDecision = async (values: {
    decision: FinalDecision;
    summary: string;
  }) => {
    if (!currentPaper) return;
    setLoading(true);
    try {
      await chairAPI.setDecision(currentPaper.id, values.decision, values.summary);
      message.success('已设置最终决定');
      setDecisionModalVisible(false);
      decisionForm.resetFields();
      loadAllData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '设置失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmails = async (paperIds?: number[]) => {
    setLoading(true);
    try {
      const response = await chairAPI.sendEmails(paperIds);
      message.success(response.data.message);
      loadAllData();
    } catch (error: any) {
      message.error(error.response?.data?.message || '发送失败');
    } finally {
      setLoading(false);
    }
  };

  const handleViewEmail = (log: EmailLog) => {
    setSelectedEmailLog(log);
    setEmailDrawerVisible(true);
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

  const paperColumns = [
    {
      title: '论文标题',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Paper) => (
        <Button
          type="link"
          onClick={() => navigate(`/chair/papers/${record.id}`)}
          style={{ padding: 0 }}
        >
          {text}
        </Button>
      )
    },
    {
      title: '作者',
      dataIndex: 'authorName',
      key: 'authorName'
    },
    {
      title: '关键词',
      dataIndex: 'keywords',
      key: 'keywords',
      render: (keywords: string[]) => (
        <div className="paper-tags">
          {keywords.slice(0, 3).map((kw, idx) => (
            <Tag key={idx} color="blue" style={{ fontSize: '12px' }}>
              {kw}
            </Tag>
          ))}
          {keywords.length > 3 && (
            <Tag style={{ fontSize: '12px' }}>+{keywords.length - 3}</Tag>
          )}
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
        <div className="progress-section" style={{ minWidth: '150px' }}>
          <div className="progress-label">
            <span>
              {record.completedReviews}/{record.totalReviews}
            </span>
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
      title: '平均评分',
      dataIndex: 'avgRating',
      key: 'avgRating',
      render: (rating: number | null) =>
        rating !== null ? (
          <Space>
            <Rate disabled value={rating} style={{ fontSize: '16px' }} />
            <Text>({rating})</Text>
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        )
    },
    {
      title: '最终决定',
      dataIndex: 'finalDecision',
      key: 'finalDecision',
      render: (decision: string | null) =>
        decision ? (
          <Tag
            color={
              decision === 'accept'
                ? 'green'
                : decision === 'reject'
                ? 'red'
                : 'orange'
            }
          >
            {decisionText[decision]}
          </Tag>
        ) : (
          <Text type="secondary">待决定</Text>
        )
    },
    {
      title: '邮件通知',
      dataIndex: 'emailSent',
      key: 'emailSent',
      render: (sent: boolean) =>
        sent ? (
          <Tag color="green">已发送</Tag>
        ) : (
          <Tag color="orange">待发送</Tag>
        )
    },
    {
      title: '操作',
      key: 'actions',
      fixed: 'right' as const,
      width: 280,
      render: (_: any, record: Paper) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/chair/papers/${record.id}`)}
          >
            查看
          </Button>
          {record.status === 'submitted' && (
            <Button
              type="link"
              icon={<UserAddOutlined />}
              onClick={() => handleMatchReviewers(record)}
            >
              分配审稿人
            </Button>
          )}
          {record.status === 'reviewed' && !record.finalDecision && (
            <Button
              type="link"
              icon={<SettingOutlined />}
              onClick={() => handleOpenDecisionModal(record)}
            >
              做决定
            </Button>
          )}
          {record.finalDecision && !record.emailSent && (
            <Button
              type="link"
              icon={<SendOutlined />}
              onClick={() => handleSendEmails([record.id])}
            >
              发通知
            </Button>
          )}
        </Space>
      )
    }
  ];

  const getQualityColor = (score: number): string => {
    if (score >= 4.5) return '#52c41a';
    if (score >= 3.5) return '#1890ff';
    if (score >= 2.5) return '#faad14';
    return '#ff4d4f';
  };

  const getQualityText = (score: number): string => {
    if (score >= 4.5) return '优秀';
    if (score >= 3.5) return '良好';
    if (score >= 2.5) return '一般';
    return '待提升';
  };

  const reviewerColumns = [
    {
      title: '姓名',
      dataIndex: 'reviewerName',
      key: 'reviewerName'
    },
    {
      title: '邮箱',
      dataIndex: 'reviewerEmail',
      key: 'reviewerEmail'
    },
    {
      title: '所属单位',
      dataIndex: 'affiliation',
      key: 'affiliation'
    },
    {
      title: '研究领域',
      dataIndex: 'researchKeywords',
      key: 'researchKeywords',
      render: (keywords: string[] | null) =>
        keywords ? (
          <div className="paper-tags">
            {keywords.map((kw, idx) => (
              <Tag key={idx} color="purple" style={{ fontSize: '12px' }}>
                {kw}
              </Tag>
            ))}
          </div>
        ) : (
          <Text type="secondary">未设置</Text>
        )
    },
    {
      title: '平均评分',
      dataIndex: 'avgRating',
      key: 'avgRating',
      render: (rating: number) =>
        rating > 0 ? (
          <Space>
            <Rate disabled value={rating} style={{ fontSize: '16px' }} />
            <Text>({rating})</Text>
          </Space>
        ) : (
          <Text type="secondary">-</Text>
        )
    },
    {
      title: '审稿质量评分',
      dataIndex: 'avgQualityScore',
      key: 'avgQualityScore',
      render: (score: number, record: ReviewerWithStats) =>
        score > 0 ? (
          <Space>
            <Progress
              type="circle"
              percent={score * 20}
              size={50}
              strokeColor={getQualityColor(score)}
              format={() => score.toFixed(1)}
            />
            <div>
              <Tag color={getQualityColor(score)} style={{ marginBottom: '4px' }}>
                {getQualityText(score)}
              </Tag>
              <div style={{ fontSize: '12px', color: '#666' }}>
                优秀: {record.qualityDistribution?.excellent || 0} |
                良好: {record.qualityDistribution?.good || 0} |
                一般: {record.qualityDistribution?.fair || 0} |
                待提升: {record.qualityDistribution?.poor || 0}
              </div>
            </div>
          </Space>
        ) : (
          <Text type="secondary">暂无数据</Text>
        )
    },
    {
      title: '总审稿数',
      dataIndex: 'totalReviews',
      key: 'totalReviews'
    },
    {
      title: '已完成',
      dataIndex: 'completedReviews',
      key: 'completedReviews'
    },
    {
      title: '完成率',
      key: 'completionRate',
      render: (_: any, record: ReviewerWithStats) =>
        record.totalReviews > 0 ? (
          <Text>
            {Math.round((record.completedReviews / record.totalReviews) * 100)}%
          </Text>
        ) : (
          <Text type="secondary">-</Text>
        )
    }
  ];

  if (!statistics) {
    return <Layout title="学术会议投稿系统 - 主席端">加载中...</Layout>;
  }

  const overviewStats = [
    {
      title: '总投稿数',
      value: statistics.totalPapers,
      icon: <FileTextOutlined />,
      color: '#667eea'
    },
    {
      title: '总作者数',
      value: statistics.totalAuthors,
      icon: <UserOutlined />,
      color: '#1890ff'
    },
    {
      title: '总审稿人数',
      value: statistics.totalReviewers,
      icon: <TeamOutlined />,
      color: '#722ed1'
    },
    {
      title: '审稿完成率',
      value: `${statistics.reviewProgress}%`,
      icon: <CheckCircleOutlined />,
      color: '#52c41a'
    },
    {
      title: '已录用',
      value: statistics.byDecision.accept,
      icon: <CheckCircleOutlined />,
      color: '#52c41a'
    },
    {
      title: '待发送邮件',
      value: statistics.emailsPending,
      icon: <MailOutlined />,
      color: '#fa8c16'
    }
  ];

  return (
    <Layout title="学术会议投稿系统 - 主席端">
      <Tabs
        activeKey={activeTab}
        onChange={(key) => setSearchParams({ tab: key })}
        style={{ marginBottom: '24px' }}
        items={[
          {
            key: 'overview',
            label: '总览'
          },
          {
            key: 'papers',
            label: '论文管理'
          },
          {
            key: 'reviewers',
            label: '审稿人管理'
          },
          {
            key: 'emails',
            label: '邮件通知'
          }
        ]}
      />

      {activeTab === 'overview' && (
        <>
          <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
            {overviewStats.map((stat, idx) => (
              <Col xs={12} sm={8} md={4} key={idx}>
                <div className="stat-card">
                  <div
                    style={{
                      fontSize: '28px',
                      color: stat.color,
                      marginBottom: '8px'
                    }}
                  >
                    {stat.icon}
                  </div>
                  <div className="stat-value" style={{ color: stat.color }}>
                    {stat.value}
                  </div>
                  <div className="stat-label">{stat.title}</div>
                </div>
              </Col>
            ))}
          </Row>

          <Row gutter={[16, 16]}>
            <Col xs={24} md={12}>
              <Card className="card-shadow" title="投稿状态分布">
                <Row gutter={[16, 16]}>
                  {Object.entries(statistics.byStatus).map(([key, value]) => (
                    <Col span={12} key={key}>
                      <Card size="small" style={{ background: '#fafafa' }}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                          >
                            <Text>
                              {
                                statusText[
                                  key as keyof typeof statusText
                                ]
                              }
                            </Text>
                            <Text strong style={{ fontSize: '18px' }}>
                              {value}
                            </Text>
                          </div>
                          <Progress
                            percent={
                              statistics.totalPapers > 0
                                ? Math.round(
                                    (value / statistics.totalPapers) * 100
                                  )
                                : 0
                            }
                            size="small"
                            showInfo={false}
                          />
                        </Space>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card
                className="card-shadow"
                title="快速操作"
                extra={
                  <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={() => handleSendEmails()}
                    disabled={statistics.emailsPending === 0}
                  >
                    一键发送所有录用通知 ({statistics.emailsPending})
                  </Button>
                }
              >
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Card size="small">
                    <Meta
                      title="待分配审稿人"
                      description={`${statistics.byStatus.submitted} 篇论文等待分配审稿人`}
                    />
                  </Card>
                  <Card size="small">
                    <Meta
                      title="审稿中"
                      description={`${statistics.byStatus.reviewing} 篇论文正在审稿中`}
                    />
                  </Card>
                  <Card size="small">
                    <Meta
                      title="待做最终决定"
                      description={`${statistics.byStatus.reviewed} 篇论文已完成审稿，等待最终决定`}
                    />
                  </Card>
                </Space>
              </Card>
            </Col>
          </Row>
        </>
      )}

      {activeTab === 'papers' && (
        <Card className="card-shadow">
          <div
            style={{
              marginBottom: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Title level={4} style={{ margin: 0 }}>
              所有投稿论文
            </Title>
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => handleSendEmails()}
              disabled={statistics.emailsPending === 0}
            >
              一键发送所有录用通知
            </Button>
          </div>
          <Table
            columns={paperColumns}
            dataSource={papers}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
            scroll={{ x: 1200 }}
          />
        </Card>
      )}

      {activeTab === 'reviewers' && (
        <Card className="card-shadow">
          <Title level={4} style={{ marginBottom: '16px' }}>
            审稿人管理
          </Title>
          <Table
            columns={reviewerColumns}
            dataSource={reviewers}
            rowKey="id"
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      )}

      {activeTab === 'emails' && (
        <Card
          className="card-shadow"
          title="邮件通知日志"
          extra={
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={() => handleSendEmails()}
              disabled={statistics.emailsPending === 0}
            >
              一键发送所有录用通知
            </Button>
          }
        >
          {emailLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
              <MailOutlined style={{ fontSize: '48px', marginBottom: '16px' }} />
              <Paragraph>暂无邮件发送记录</Paragraph>
            </div>
          ) : (
            <List
              dataSource={emailLogs}
              renderItem={(log) => (
                <List.Item
                  actions={[
                    <Button
                      type="link"
                      icon={<EyeOutlined />}
                      onClick={() => handleViewEmail(log)}
                    >
                      查看详情
                    </Button>
                  ]}
                >
                  <List.Item.Meta
                    title={log.subject}
                    description={
                      <Space>
                        <Text type="secondary">发送至：</Text>
                        <Text>{log.to}</Text>
                        <Text type="secondary">
                          {dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss')}
                        </Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      )}

      <Modal
        title="分配审稿人"
        open={assignModalVisible}
        onCancel={() => {
          setAssignModalVisible(false);
          setSelectedReviewers([]);
        }}
        width={700}
        footer={
          <Space>
            <Button
              onClick={() => {
                setAssignModalVisible(false);
                setSelectedReviewers([]);
              }}
            >
              取消
            </Button>
            <Button type="primary" onClick={handleAutoAssign} loading={loading}>
              智能自动分配
            </Button>
            <Button
              type="primary"
              onClick={handleManualAssign}
              loading={loading}
              disabled={selectedReviewers.length === 0}
            >
              手动分配选中 ({selectedReviewers.length})
            </Button>
          </Space>
        }
      >
        {currentPaper && (
          <div style={{ marginBottom: '16px' }}>
            <Text strong>论文：</Text>
            <Text>{currentPaper.title}</Text>
            <div style={{ marginTop: '8px' }}>
              <Text strong>关键词：</Text>
              <Space size={[4, 4]} wrap>
                {currentPaper.keywords.map((kw, idx) => (
                  <Tag key={idx} color="blue">
                    {kw}
                  </Tag>
                ))}
              </Space>
            </div>
          </div>
        )}

        <Divider orientation="left">匹配的审稿人（按匹配度排序）</Divider>

        {matchingLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            正在匹配审稿人...
          </div>
        ) : matchedReviewers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            <Paragraph>未找到匹配的审稿人，请添加更多审稿人或调整关键词</Paragraph>
          </div>
        ) : (
          <Checkbox.Group
            value={selectedReviewers}
            onChange={(values) => setSelectedReviewers(values as number[])}
            style={{ width: '100%' }}
          >
            <List
              dataSource={matchedReviewers}
              renderItem={(reviewer) => (
                <List.Item
                  style={{
                    border: '1px solid #e8e8e8',
                    borderRadius: '8px',
                    marginBottom: '8px',
                    padding: '12px'
                  }}
                >
                  <Checkbox value={reviewer.id} style={{ width: '100%' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%'
                      }}
                    >
                      <div>
                        <Text strong>{reviewer.name}</Text>
                        <Text type="secondary" style={{ marginLeft: '8px' }}>
                          {reviewer.affiliation}
                        </Text>
                        <div style={{ marginTop: '4px' }}>
                          <Space size={[4, 4]} wrap>
                            {reviewer.researchKeywords?.map((kw, idx) => (
                              <Tag
                                key={idx}
                                color={
                                  reviewer.matchedKeywords.includes(kw)
                                    ? 'green'
                                    : 'default'
                                }
                                style={{ fontSize: '12px' }}
                              >
                                {kw}
                              </Tag>
                            ))}
                          </Space>
                        </div>
                      </div>
                      <div className="reviewer-match-score">
                        匹配度：{reviewer.matchScore}
                      </div>
                    </div>
                  </Checkbox>
                </List.Item>
              )}
            />
          </Checkbox.Group>
        )}
      </Modal>

      <Modal
        title="设置最终决定"
        open={decisionModalVisible}
        onCancel={() => {
          setDecisionModalVisible(false);
          decisionForm.resetFields();
        }}
        footer={null}
        width={600}
      >
        {currentPaper && (
          <div style={{ marginBottom: '16px' }}>
            <Text strong>论文：</Text>
            <Text>{currentPaper.title}</Text>
            <div style={{ marginTop: '8px' }}>
              <Text strong>作者：</Text>
              <Text>{currentPaper.authorName}</Text>
            </div>
            <div style={{ marginTop: '8px' }}>
              <Text strong>已完成审稿：</Text>
              <Text>
                {currentPaper.completedReviews}/{currentPaper.totalReviews}
              </Text>
              {currentPaper.avgRating !== null && currentPaper.avgRating !== undefined && (
                <Space style={{ marginLeft: '16px' }}>
                  <Rate disabled value={currentPaper.avgRating} style={{ fontSize: '16px' }} />
                  <Text type="secondary">({currentPaper.avgRating}/5)</Text>
                </Space>
              )}
            </div>
          </div>
        )}

        <Form
          form={decisionForm}
          layout="vertical"
          onFinish={handleSetDecision}
          size="large"
        >
          <Form.Item
            name="decision"
            label="最终决定"
            rules={[{ required: true, message: '请选择最终决定' }]}
          >
            <Select placeholder="请选择最终决定">
              <Option value="accept">录用</Option>
              <Option value="minor_revision">小修后录用</Option>
              <Option value="major_revision">大修后再审</Option>
              <Option value="reject">拒稿</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="summary"
            label="评语汇总（可选）"
          >
            <TextArea
              rows={4}
              placeholder="请输入给作者的评语汇总，将随录用通知邮件发送给作者"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setDecisionModalVisible(false);
                  decisionForm.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                确认
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title="邮件详情"
        placement="right"
        width={600}
        open={emailDrawerVisible}
        onClose={() => setEmailDrawerVisible(false)}
      >
        {selectedEmailLog && (
          <Space direction="vertical" style={{ width: '100%' }}>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="收件人">
                {selectedEmailLog.to}
              </Descriptions.Item>
              <Descriptions.Item label="主题">
                {selectedEmailLog.subject}
              </Descriptions.Item>
              <Descriptions.Item label="发送时间">
                {dayjs(selectedEmailLog.timestamp).format(
                  'YYYY-MM-DD HH:mm:ss'
                )}
              </Descriptions.Item>
              <Descriptions.Item label="关联论文">
                {selectedEmailLog.paperId
                  ? `论文 #${selectedEmailLog.paperId}`
                  : '-'}
              </Descriptions.Item>
            </Descriptions>
            <Divider orientation="left">邮件内容</Divider>
            <div className="email-log-body">{selectedEmailLog.body}</div>
          </Space>
        )}
      </Drawer>
    </Layout>
  );
};

export default ChairDashboard;
