import React, { useState, useEffect } from 'react';
import {
  Card,
  Descriptions,
  Button,
  Form,
  Input,
  Rate,
  Select,
  Tag,
  message,
  Space,
  Divider,
  Typography,
  Row,
  Col,
  Progress
} from 'antd';
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  SaveOutlined
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import { reviewAPI, paperAPI } from '../services/api';
import { ReviewTask, statusText, statusColor, Recommendation } from '../types';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ReviewDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [review, setReview] = useState<ReviewTask | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm();

  const loadReview = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const response = await reviewAPI.getReview(parseInt(id));
      setReview(response.data);
      if (response.data.completed) {
        form.setFieldsValue({
          rating: response.data.rating,
          comment: response.data.comment,
          recommendation: response.data.recommendation
        });
      }
    } catch (error) {
      message.error('加载审稿详情失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReview();
  }, [id]);

  const handleSubmit = async (values: {
    rating: number;
    comment: string;
    recommendation: Recommendation;
  }) => {
    if (!id) return;
    setSubmitting(true);
    try {
      await reviewAPI.submitReview(parseInt(id), values);
      message.success('审稿意见提交成功');
      loadReview();
    } catch (error: any) {
      message.error(error.response?.data?.message || '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async () => {
    if (!review) return;
    try {
      const response = await paperAPI.downloadPaper(review.originalFileName);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', review.originalFileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      message.error('下载失败');
    }
  };

  if (!review) {
    return <Layout title="审稿详情">加载中...</Layout>;
  }

  return (
    <Layout title="审稿详情">
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={() => navigate('/reviewer')}
        style={{ marginBottom: '16px' }}
      >
        返回列表
      </Button>

      <Card className="card-shadow" loading={loading}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <Title level={3} style={{ margin: 0 }}>
            {review.paperTitle}
          </Title>
          <Space>
            <Tag color={statusColor[review.paperStatus]}>
              {statusText[review.paperStatus]}
            </Tag>
            {review.completed ? (
              <Tag color="green">已完成审稿</Tag>
            ) : (
              <Tag color="orange">待审稿</Tag>
            )}
          </Space>
        </div>

        <Descriptions bordered size="small" style={{ marginBottom: '24px' }}>
          <Descriptions.Item label="作者" span={3}>
            {review.authorName}
          </Descriptions.Item>
          <Descriptions.Item label="关键词" span={3}>
            <div className="paper-tags">
              {review.paperKeywords.map((kw, idx) => (
                <Tag key={idx} color="blue">
                  {kw}
                </Tag>
              ))}
            </div>
          </Descriptions.Item>
          <Descriptions.Item label="分配时间" span={2}>
            {dayjs(review.assignedAt).format('YYYY-MM-DD HH:mm')}
          </Descriptions.Item>
          <Descriptions.Item label="完成时间" span={1}>
            {review.completedAt ? dayjs(review.completedAt).format('YYYY-MM-DD HH:mm') : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="摘要" span={3}>
            <Paragraph style={{ marginBottom: 0 }}>{review.paperAbstract}</Paragraph>
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

        <Divider orientation="left">审稿意见</Divider>

        {review.completed ? (
          <Card size="small" style={{ background: '#fafafa' }}>
            <Descriptions bordered size="small">
              <Descriptions.Item label="推荐程度" span={3}>
                <Rate disabled value={review.rating || 0} />
                <Text style={{ marginLeft: '8px' }}>({review.rating}/5)</Text>
              </Descriptions.Item>
              <Descriptions.Item label="建议" span={3}>
                <Tag
                  color={
                    review.recommendation === 'accept'
                      ? 'green'
                      : review.recommendation === 'reject'
                      ? 'red'
                      : 'orange'
                  }
                >
                  {review.recommendation ? (
                    {
                      accept: '录用',
                      minor_revision: '小修后录用',
                      major_revision: '大修后再审',
                      reject: '拒稿'
                    }[review.recommendation]
                  ) : (
                    '-'
                  )}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="详细评论" span={3}>
                <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>
                  {review.comment}
                </Paragraph>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        ) : (
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            size="large"
          >
            <Form.Item
              name="rating"
              label="推荐程度"
              rules={[{ required: true, message: '请选择推荐程度' }]}
            >
              <Rate />
            </Form.Item>

            <Form.Item
              name="recommendation"
              label="审稿建议"
              rules={[{ required: true, message: '请选择审稿建议' }]}
            >
              <Select placeholder="请选择审稿建议">
                <Option value="accept">录用</Option>
                <Option value="minor_revision">小修后录用</Option>
                <Option value="major_revision">大修后再审</Option>
                <Option value="reject">拒稿</Option>
              </Select>
            </Form.Item>

            <Form.Item
              name="comment"
              label="详细评论"
              rules={[{ required: true, message: '请填写详细评论' }]}
            >
              <TextArea
                rows={6}
                placeholder="请输入详细的审稿意见，包括论文的创新点、优缺点、改进建议等"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={submitting}
                size="large"
              >
                提交审稿意见
              </Button>
            </Form.Item>
          </Form>
        )}
      </Card>
    </Layout>
  );
};

export default ReviewDetail;
