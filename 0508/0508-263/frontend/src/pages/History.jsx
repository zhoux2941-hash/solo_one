import React, { useState, useEffect } from 'react';
import { List, Card, Button, Empty, Typography } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { userApi } from '../services/api';
import usePlayerStore from '../store/usePlayerStore';

const { Title } = Typography;

const History = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const setCurrentMusic = usePlayerStore(state => state.setCurrentMusic);
  const setPlaylist = usePlayerStore(state => state.setPlaylist);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const response = await userApi.getPlayHistory(50);
      if (response.data.success) {
        setHistory(response.data.data);
      }
    } catch (error) {
      console.error('加载播放历史失败', error);
    }
    setLoading(false);
  };

  const handlePlay = (music) => {
    setPlaylist(history);
    setCurrentMusic(music);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card>
        <Title level={2}>播放历史</Title>
        {history.length === 0 ? (
          <Empty description="暂无播放记录" />
        ) : (
          <List
            loading={loading}
            dataSource={history}
            renderItem={(music, index) => (
              <List.Item
                actions={[
                  <Button
                    type="text"
                    icon={<PlayCircleOutlined />}
                    onClick={() => handlePlay(music)}
                  >
                    播放
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
                      {index + 1}. {music.title}
                    </span>
                  }
                  description={music.artist || '未知艺术家'}
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
};

export default History;
