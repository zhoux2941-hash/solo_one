import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Spin, message, Typography, Empty, Tag, Space, Alert } from 'antd';
import { PlayCircleOutlined, ClockCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { shareApi, musicApi } from '../services/api';
import usePlayerStore from '../store/usePlayerStore';

const { Title, Text } = Typography;

const Share = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [music, setMusic] = useState(null);
  const [shareInfo, setShareInfo] = useState(null);
  const [error, setError] = useState(null);
  const setCurrentMusic = usePlayerStore(state => state.setCurrentMusic);

  useEffect(() => {
    loadShare();
  }, [code]);

  const loadShare = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await shareApi.getShare(code);
      if (response.data.success) {
        const share = response.data.data;
        setShareInfo(share);
        if (share.targetType === 'MUSIC') {
          const musicResponse = await musicApi.getMusic(share.targetId);
          if (musicResponse.data.success) {
            setMusic(musicResponse.data.data);
          }
        }
      } else {
        setError(response.data.message);
        message.error(response.data.message);
      }
    } catch (error) {
      setError('加载分享失败');
      console.error('加载分享失败', error);
    }
    setLoading(false);
  };

  const handlePlay = () => {
    if (music) {
      setCurrentMusic(music);
      navigate('/');
    }
  };

  const formatExpireTime = (expireAt) => {
    if (!expireAt) return '永久有效';
    const expireDate = new Date(expireAt);
    const now = new Date();
    const diff = expireDate - now;
    if (diff <= 0) return '已过期';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days} 天后过期`;
    if (hours > 0) return `${hours} 小时后过期`;
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes} 分钟后过期`;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error || !music) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: 24,
      }}>
        <Card style={{ width: 400, textAlign: 'center' }}>
          <Empty
            description={
              <div>
                <p style={{ fontSize: 16, fontWeight: 500, marginBottom: 8 }}>
                  {error || '分享链接不存在'}
                </p>
                <p style={{ color: '#888', fontSize: 12 }}>
                  链接可能已过期或被删除
                </p>
              </div>
            }
          >
            <Button type="primary" onClick={() => navigate('/login')}>
              前往音乐平台
            </Button>
          </Empty>
        </Card>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: 24,
    }}>
      <Card style={{ width: 400, textAlign: 'center' }}>
        <div style={{ marginBottom: 24 }}>
          <img
            src={music.cover ? `/api/files/cover/${music.cover}` : 'https://via.placeholder.com/200'}
            alt={music.title}
            style={{ width: 200, height: 200, borderRadius: 8, objectFit: 'cover' }}
          />
        </div>
        <Title level={3}>{music.title}</Title>
        <p style={{ color: '#888', marginBottom: 16 }}>{music.artist || '未知艺术家'}</p>

        <Space direction="vertical" style={{ width: '100%', marginBottom: 24 }}>
          <Alert
            message={
              <Space>
                <ClockCircleOutlined />
                <span>{formatExpireTime(shareInfo?.expireAt)}</span>
              </Space>
            }
            type={shareInfo?.expireAt ? 'info' : 'warning'}
            showIcon={false}
          />
          <div style={{ textAlign: 'left' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              访问次数：{shareInfo?.accessCount || 0} 次
            </Text>
          </div>
        </Space>

        <Button
          type="primary"
          size="large"
          icon={<PlayCircleOutlined />}
          onClick={handlePlay}
          block
        >
          播放音乐
        </Button>
        <div style={{ marginTop: 24, color: '#888', fontSize: 12 }}>
          这是一个分享链接，点击播放按钮即可播放音乐
        </div>
      </Card>
    </div>
  );
};

export default Share;
