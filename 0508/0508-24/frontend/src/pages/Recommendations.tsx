import { useState, useEffect } from 'react'
import {
  Card,
  List,
  Avatar,
  Tag,
  Button,
  Space,
  Typography,
  Rate,
  Select,
  Row,
  Col,
  Statistic,
} from 'antd'
import {
  BookOutlined,
  StarOutlined,
  UserOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons'
import { recommendationApi, analysisApi, borrowApi } from '../services/api'
import type { RecommendedBook, TagInterest, BorrowRecord } from '../types'

const { Title, Text, Paragraph } = Typography

interface RecommendationsProps {
  readerId: number | null
}

function Recommendations({ readerId }: RecommendationsProps) {
  const [recommendations, setRecommendations] = useState<RecommendedBook[]>([])
  const [interests, setInterests] = useState<TagInterest[]>([])
  const [records, setRecords] = useState<BorrowRecord[]>([])
  const [limit, setLimit] = useState(10)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (readerId) {
      loadData()
    }
  }, [readerId, limit])

  const loadData = async () => {
    if (!readerId) return
    setLoading(true)
    try {
      const [recRes, interestRes, recordsRes] = await Promise.all([
        recommendationApi.getRecommendations(readerId, limit),
        analysisApi.getInterestVector(readerId),
        borrowApi.getByReader(readerId),
      ])
      setRecommendations(recRes.data.data)
      setInterests(interestRes.data.data.slice(0, 5))
      setRecords(recordsRes.data.data.slice(0, 5))
    } catch (error) {
      console.error('Failed to load recommendations:', error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return '#52c41a'
    if (score >= 0.5) return '#1890ff'
    if (score >= 0.3) return '#faad14'
    return '#999'
  }

  return (
    <div>
      <Space style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          智能推荐
        </Title>
        <Select
          value={limit}
          onChange={setLimit}
          style={{ width: 120 }}
          options={[
            { label: '5本', value: 5 },
            { label: '10本', value: 10 },
            { label: '15本', value: 15 },
            { label: '20本', value: 20 },
          ]}
        />
      </Space>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card>
            <Statistic
              title="推荐书籍数"
              value={recommendations.length}
              prefix={<BookOutlined />}
              suffix="本"
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card>
            <Statistic
              title="已借阅书籍数"
              value={records.length}
              prefix={<ShoppingCartOutlined />}
              suffix="本"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="您的兴趣标签" style={{ marginBottom: 24 }} loading={loading}>
        <Space wrap size={[8, 8]}>
          {interests.map((interest, idx) => (
            <Tag
              key={interest.tag}
              color={['blue', 'green', 'orange', 'red', 'purple'][idx % 5]}
              style={{ fontSize: 14, padding: '6px 16px' }}
            >
              {interest.tag}
              <span style={{ marginLeft: 8, opacity: 0.9 }}>
                权重: {(interest.storedWeight ?? interest.weight ?? 0).toFixed(2)}
              </span>
            </Tag>
          ))}
          {interests.length === 0 && (
            <Text type="secondary">暂无兴趣数据，系统将推荐热门书籍</Text>
          )}
        </Space>
      </Card>

      <Card title="为您推荐" loading={loading}>
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 2, lg: 3, xl: 3, xxl: 4 }}
          dataSource={recommendations}
          renderItem={(item, index) => (
            <List.Item>
              <Card
                hoverable
                style={{ height: '100%' }}
                cover={
                  <div
                    style={{
                      height: 200,
                      background: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: 48,
                    }}
                  >
                    <BookOutlined />
                  </div>
                }
              >
                <Card.Meta
                  title={
                    <Space>
                      <span>{item.book.title}</span>
                      <Tag color="blue">推荐 #{index + 1}</Tag>
                    </Space>
                  }
                  description={
                    <div>
                      <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 8 }}>
                        {item.book.description || '暂无简介'}
                      </Paragraph>
                      <div style={{ marginBottom: 8 }}>
                        <Space split={<span>|</span>}>
                          {item.book.author && (
                            <span>
                              <UserOutlined style={{ marginRight: 4 }} />
                              {item.book.author}
                            </span>
                          )}
                          {item.book.category && <span>{item.book.category}</span>}
                        </Space>
                      </div>
                      {item.book.tags && (
                        <div style={{ marginBottom: 8 }}>
                          <Space wrap>
                            {item.book.tags.split(',').map((tag) => (
                              <Tag key={tag} color="geekblue">
                                {tag}
                              </Tag>
                            ))}
                          </Space>
                        </div>
                      )}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          marginBottom: 8,
                        }}
                      >
                        <Text strong style={{ color: getScoreColor(item.score), marginRight: 8 }}>
                          匹配度: {(item.score * 100).toFixed(1)}%
                        </Text>
                        <Rate
                          disabled
                          allowHalf
                          value={Math.min(item.score * 5, 5)}
                          style={{ fontSize: 14 }}
                        />
                      </div>
                      <div>
                        <Text strong>推荐理由：</Text>
                        <div style={{ marginTop: 4 }}>
                          <Space wrap>
                            {item.matchReasons.map((reason, idx) => (
                              <Tag key={idx} color="success">
                                {reason}
                              </Tag>
                            ))}
                          </Space>
                        </div>
                      </div>
                    </div>
                  }
                />
                <div style={{ marginTop: 16, textAlign: 'right' }}>
                  <Button type="primary" icon={<ShoppingCartOutlined />}>
                    立即借阅
                  </Button>
                </div>
              </Card>
            </List.Item>
          )}
        />
      </Card>

      <Card title="推荐算法说明" style={{ marginTop: 24 }}>
        <div style={{ lineHeight: 1.8 }}>
          <p>
            <strong>推荐算法采用混合策略</strong>
            ，综合考虑以下因素：
          </p>
          <ul style={{ marginLeft: 20 }}>
            <li>
              <strong>协同过滤（40%权重）</strong>
              ：根据与您兴趣相似的读者借阅记录推荐
            </li>
            <li>
              <strong>基于内容过滤（35%权重）</strong>
              ：根据您喜欢的标签推荐相似书籍
            </li>
            <li>
              <strong>趋势推荐（25%权重）</strong>
              ：推荐当前热门且符合您兴趣的书籍
            </li>
          </ul>
          <p>
            <strong>时间衰减机制</strong>
            ：越早的借阅记录权重越低，越新的借阅记录权重越高，确保推荐结果能反映您当前的阅读兴趣。
          </p>
          <p>
            <strong>冷启动处理</strong>
            ：如果您没有借阅历史，系统将推荐图书馆的热门书籍。
          </p>
        </div>
      </Card>
    </div>
  )
}

export default Recommendations
