import React, { useState, useEffect } from 'react';
import { List, Card, Button, Tag, message, Empty, Modal, Typography } from 'antd';
import { CheckOutlined, CloseOutlined, EyeOutlined } from '@ant-design/icons';
import { musicApi } from '../services/api';

const { Title, Paragraph } = Typography;

const Admin = () => {
  const [pendingMusics, setPendingMusics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [detailVisible, setDetailVisible] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState(null);

  useEffect(() => {
    loadPendingMusics();
  }, []);

  const loadPendingMusics = async () => {
    setLoading(true);
    try {
      const response = await musicApi.getPendingMusics(0, 50);
      if (response.data.success) {
        setPendingMusics(response.data.data.content || []);
      }
    } catch (error) {
      console.error('加载待审核音乐失败', error);
    }
    setLoading(false);
  };

  const handleApprove = async (id) => {
    try {
      const response = await musicApi.approveMusic(id);
      if (response.data.success) {
        message.success('审核通过');
        loadPendingMusics();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleReject = async (id) => {
    try {
      const response = await musicApi.rejectMusic(id);
      if (response.data.success) {
        message.success('已拒绝');
        loadPendingMusics();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error('操作失败');
    }
  };

  const handleViewDetail = (music) => {
    setSelectedMusic(music);
    setDetailVisible(true);
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <Card title="音乐审核" loading={loading}>
        {pendingMusics.length === 0 ? (
          <Empty description="暂无待审核音乐" />
        ) : (
          <List
            dataSource={pendingMusics}
            renderItem={(music) => (
              <List.Item
                actions={[
                  <Button
                    type="text"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewDetail(music)}
                  >
                    详情
                  </Button>,
                  <Button
                    type="text"
                    icon={<CheckOutlined />}
                    style={{ color: '#52c41a' }}
                    onClick={() => handleApprove(music.id)}
                  >
                    通过
                  </Button>,
                  <Button
                    type="text"
                    danger
                    icon={<CloseOutlined />}
                    onClick={() => handleReject(music.id)}
                  >
                    拒绝
                  </Button>,
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <img
                      src={music.cover ? `/api/files/cover/${music.cover}` : 'https://via.placeholder.com/50'}
                      alt={music.title}
                      style={{ width: 50, height: 50, borderRadius: 4 }}
                    />
                  }
                  title={
                    <span>
                      {music.title}
                      <Tag color="orange" style={{ marginLeft: 8 }}>待审核</Tag>
                    </span>
                  }
                  description={
                    <div>
                      <p>艺术家：{music.artist || '未知'}</p>
                      <p>上传者：{music.uploaderName}</p>
                      <p>上传时间：{new Date(music.createdAt).toLocaleString()}</p>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>

      <Modal
        title="音乐详情"
        open={detailVisible}
        onCancel={() => setDetailVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailVisible(false)}>
            关闭
          </Button>,
          <Button
            key="reject"
            danger
            onClick={() => {
              handleReject(selectedMusic.id);
              setDetailVisible(false);
            }}
          >
            拒绝
          </Button>,
          <Button
            key="approve"
            type="primary"
            onClick={() => {
              handleApprove(selectedMusic.id);
              setDetailVisible(false);
            }}
          >
            通过
          </Button>,
        ]}
        width={600}
      >
        {selectedMusic && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <img
                src={selectedMusic.cover ? `/api/files/cover/${selectedMusic.cover}` : 'https://via.placeholder.com/200'}
                alt={selectedMusic.title}
                style={{ width: 200, height: 200, borderRadius: 8 }}
              />
            </div>
            <Title level={4}>{selectedMusic.title}</Title>
            <p><strong>艺术家：</strong>{selectedMusic.artist || '未知'}</p>
            <p><strong>专辑：</strong>{selectedMusic.album || '未知'}</p>
            <p><strong>上传者：</strong>{selectedMusic.uploaderName}</p>
            <p>
              <strong>标签：</strong>
              {selectedMusic.tags && selectedMusic.tags.split(',').map((tag, i) => (
                <Tag key={i} color="blue">{tag}</Tag>
              ))}
            </p>
            {selectedMusic.description && (
              <div>
                <strong>描述：</strong>
                <Paragraph>{selectedMusic.description}</Paragraph>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default Admin;
