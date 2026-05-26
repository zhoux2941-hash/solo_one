import React, { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Button,
  Tag,
  message,
  Space,
  Divider,
  Typography,
  Progress,
  Rate,
  Row,
  Col,
  Avatar,
  List
} from 'antd';
import { ArrowLeftOutlined, DownloadOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import { paperAPI } from '../services/api';
import { Paper, statusText, statusColor, decisionText } from '../types';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const PaperDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [loading, setLoading] = useState(false);

  const loadPaper = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await paperAPI.getPaper(parseInt(id));
      setPaper(response.data);
    } catch (error) {
      message.error('加载论文详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaper();
  }, [id]);

  const handleDownload = async () => {
    if (!paper) return;
    try {
      const response = await paperAPI.downloadPaper(paper.originalFileName);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', paper.originalFileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      message.error('下载失败');
    }
  };

  const getBackRoute = () => {
    if (location.pathname.startsWith('/chair')) {
      return '/chair';
    }
    return '/author';
  };

  const getReviewerName = (reviewerName?: string, isChair?: boolean) => {
    if (isChair && reviewerName) {
      return reviewerName;
    }
    return '匿名审稿人';
  };

  if (!paper) {
    return <Layout title="论文详情">加载中...</Layout>;
  }

  const isChair = user?.role === 'chair';

  return (
    <Layout title="论文详情">
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate(getBackRoute())}
        style={{ marginBottom: '16px' }}
      >
        返回列表
      </Button>

      <Card className="card-shadow" loading={loading}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <Title level={3} style={{ margin: 0 }}>
            {paper.title}
          </Title>
          <Space>
            <Tag color={statusColor[paper.status]}>
              {statusText[paper.status]}
            </Tag>
            {paper.finalDecision && (
              <Tag
                color={
                  paper.finalDecision === 'accept'
                    ? 'green'
                    : paper.finalDecision === 'reject'
                    ? 'red'
                    : 'orange'
                }
              >
                {decisionText[paper.finalDecision]}
              </Tag>
            )}
          </Space>
        </div>

        <Descriptions bordered size="small" style={{ marginBottom: '24px' }}>
          {isChair && (
            <>
              <Descriptions.Item label="作者" span={2}>
                {paper.authorName}
              </Descriptions.Item>
              <Descriptions.Item label="作者邮箱" span={1}>
                {paper.authorEmail}
              </Descriptions.Item>
            </>
          )}
          <Descriptions.Item label="关键词" span={3}>
            <div className="paper-tags">
              {paper.keywords.map((kw, idx) => (
                <Tag key={idx} color="blue">
                  {kw}
                </Tag>
              ))}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="提交时间" span={2}>
            {dayjs(paper.submittedAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="文件名" span={1}>
            {paper.originalFileName}
          </Descriptions.Item>
          {isChair && paper.avgRating !== null && paper.avgRating !== undefined && (
            <Descriptions.Item label="平均评分" span={3}>
              <Rate disabled value={paper.avgRating} />
              <Text style={{ marginLeft: '8px' }}>({paper.avgRating}/5)</Text>
            </Descriptions.Item>
          )}
          <Descriptions.Item label="摘要" span={3}>
            <Paragraph style={{ marginBottom: 0 }}>{paper.abstract}</Paragraph>
          </Descriptions.Item>
        </Descriptions>

        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleDownload}
          style={{ marginBottom: '24px' }}
        >
          下载论文PDF
        </Button>

        <Divider orientation="left">审稿进度</Divider>

        <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
          <Col xs={24} sm={12}>
            <div style={{ textAlign: 'center', padding: '24px', background: '#fafafa', borderRadius: '8px' }}>
              <div style={{ fontSize: '36px', fontWeight: '700', color: '#667eea', marginBottom: '8px' }}>
                {paper.reviewProgress}%
              </div>
              <div style={{ color: '#666', fontSize: '14px', marginBottom: '12px' }}>
                审稿完成进度
              </div>
              <Progress
                percent={paper.reviewProgress}
                showInfo={false}
                strokeColor="#667eea"
              />
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#999' }}>
                {paper.completedReviews} / {paper.totalReviews} 位审稿人已完成
              </div>
            </div>
          </Col>
        </Row>

        {paper.finalDecision && (
          <>
            <Divider orientation="left">最终决定</Divider>
            <Card size="small" style={{ background: '#f0f5ff', marginBottom: '24px' }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <Text strong>决定：</Text>
                  <Tag
                    color={
                      paper.finalDecision === 'accept'
                        ? 'green'
                        : paper.finalDecision === 'reject'
                        ? 'red'
                        : 'orange'
                    }
                  >
                    {decisionText[paper.finalDecision]}
                  </Tag>
                </div>
                {paper.decisionSummary && (
                  <div>
                    <Text strong>评语汇总：</Text>
                    <Paragraph style={{ marginTop: '8px', marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                      {paper.decisionSummary}
                    </Paragraph>
                  </div>
                )}
                {paper.emailSent && (
                  <Tag color="green">通知邮件已发送</Tag>
                )}
              </Space>
            </Card>
          </>
        )}

        {(paper.reviewsSummary || paper.reviews) && (
          <>
            <Divider orientation="left">审稿意见</Divider>
            <List
              dataSource={isChair ? paper.reviews : paper.reviewsSummary}
              renderItem={(review: any, index: number) => (
                <List.Item key={index}>
                  <Card size="small" style={{ width: '100%', background: '#fafafa' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <Space>
                        <Avatar icon={<UserOutlined />} />
                        <Text strong>
                          {getReviewerName(review.reviewerName, isChair)}
                        </Text>
                      </Space>
                      <Space>
                        {review.rating !== null && review.rating !== undefined && (
                          <Space>
                            <Rate disabled value={review.rating} style={{ fontSize: '16px' }} />
                            <Text type="secondary">({review.rating}/5)</Text>
                          </Space>
                        )}
                        {review.recommendation && (
                          <Tag
                            color={
                              review.recommendation === 'accept'
                                ? 'green'
                                : review.recommendation === 'reject'
                                ? 'red'
                                : 'orange'
                            }
                          >
                            {decisionText[review.recommendation]}
                          </Tag>
                        )}
                        {isChair && !review.completed && (
                          <Tag color="orange">待审稿</Tag>
                        )}
                      </Space>
                    </div>
                    {review.comment && (
                      <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                        {review.comment}
                      </Paragraph>
                    )}
                    {!review.completed && isChair && (
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        审稿人尚未提交意见
                      </Text>
                    )}
                  </Card>
                </List.Item>
              )}
            />
          </>
        )}
      </Card>
    </Layout>
  );
};

export default PaperDetail;
