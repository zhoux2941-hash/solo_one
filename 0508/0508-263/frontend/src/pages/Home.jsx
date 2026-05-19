import React, { useState, useEffect } from 'react';
import { Input, List, Card, Button, Tag, Row, Col, Typography, Empty } from 'antd';
import { PlayCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { musicApi } from '../services/api';
import usePlayerStore from '../store/usePlayerStore';
import { useNavigate } from 'react-router-dom';

const { Search } = Input;
const { Title } = Typography;

const Home = () => {
  const [musics, setMusics] = useState([]);
  const [hotMusics, setHotMusics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const setCurrentMusic = usePlayerStore(state => state.setCurrentMusic);
  const setPlaylist = usePlayerStore(state => state.setPlaylist);
  const navigate = useNavigate();

  useEffect(() => {
    loadMusics();
    loadHotMusics();
  }, []);

  const loadMusics = async (searchKeyword = '') => {
    setLoading(true);
    try {
      const response = await musicApi.getMusics(0, 50, searchKeyword);
      if (response.data.success) {
        const musicList = response.data.data.content || [];
        setMusics(musicList);
      }
    } catch (error) {
      console.error('加载音乐失败', error);
    }
    setLoading(false);
  };

  const loadHotMusics = async () => {
    try {
      const response = await musicApi.getHotMusics(10);
      if (response.data.success) {
        setHotMusics(response.data.data);
      }
    } catch (error) {
      console.error('加载热门音乐失败', error);
    }
  };

  const handleSearch = (value) => {
    setKeyword(value);
    loadMusics(value);
  };

  const handlePlay = (music) => {
    setPlaylist(musics);
    setCurrentMusic(music);
  };

  const handleViewDetail = (music) => {
    navigate(`/music/${music.id}`);
  };

  return (
    <div>
      <Title level={2}>发现音乐</Title>

      <div style={{ marginBottom: 24 }}>
        <Search
          placeholder="搜索音乐..."
          allowClear
          enterButton="搜索"
          size="large"
          onSearch={handleSearch}
          style={{ maxWidth: 500 }}
        />
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Card title="最新音乐" loading={loading}>
            {musics.length === 0 ? (
              <Empty description="暂无音乐" />
            ) : (
              <List
                dataSource={musics}
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
                      <Button
                        type="text"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDetail(music)}
                      >
                        详情
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
                      description={
                        <div>
                        <span>{music.artist || '未知艺术家'}</span>
                        {music.tags && music.tags.split(',').map((tag, i) => (
                          <Tag key={i} color="blue" style={{ marginLeft: 8 }}>
                            {tag}
                          </Tag>
                        ))}
                      </div>
                    }
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="热门榜单">
            {hotMusics.length === 0 ? (
              <Empty description="暂无数据" />
            ) : (
              <List
                dataSource={hotMusics}
                renderItem={(music, index) => (
                  <List.Item onClick={() => handlePlay(music)} style={{ cursor: 'pointer' }}>
                    <List.Item.Meta
                      avatar={<span style={{ fontSize: 18, fontWeight: 'bold', color: index < 3 ? '#f5222d' : '#999' }}>{index + 1}</span>}
                      title={music.title}
                      description={music.artist || '未知艺术家'}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Home;
