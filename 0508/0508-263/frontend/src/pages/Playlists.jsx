import React, { useState, useEffect } from 'react';
import { List, Card, Button, Modal, Form, Input, Switch, message, Empty, Popconfirm } from 'antd';
import { PlusOutlined, PlayCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { playlistApi, musicApi } from '../services/api';
import usePlayerStore from '../store/usePlayerStore';

const { TextArea } = Input;

const Playlists = () => {
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [playlistMusics, setPlaylistMusics] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [allMusics, setAllMusics] = useState([]);
  const [form] = Form.useForm();
  const setCurrentMusic = usePlayerStore(state => state.setCurrentMusic);
  const setPlaylist = usePlayerStore(state => state.setPlaylist);

  useEffect(() => {
    loadPlaylists();
    loadAllMusics();
  }, []);

  const loadPlaylists = async () => {
    try {
      const response = await playlistApi.getMyPlaylists();
      if (response.data.success) {
        setPlaylists(response.data.data);
        if (response.data.data.length > 0 && !selectedPlaylist) {
          loadPlaylistMusics(response.data.data[0].id);
          setSelectedPlaylist(response.data.data[0]);
        }
      }
    } catch (error) {
      console.error('加载歌单失败', error);
    }
  };

  const loadAllMusics = async () => {
    try {
      const response = await musicApi.getMusics(0, 100);
      if (response.data.success) {
        setAllMusics(response.data.data.content || []);
      }
    } catch (error) {
      console.error('加载音乐失败', error);
    }
  };

  const loadPlaylistMusics = async (playlistId) => {
    try {
      const response = await playlistApi.getPlaylistMusics(playlistId);
      if (response.data.success) {
        setPlaylistMusics(response.data.data);
      }
    } catch (error) {
      console.error('加载歌单音乐失败', error);
    }
  };

  const handleCreatePlaylist = async (values) => {
    try {
      const response = await playlistApi.createPlaylist(values);
      if (response.data.success) {
        message.success('创建成功');
        setModalVisible(false);
        form.resetFields();
        loadPlaylists();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error('创建失败');
    }
  };

  const handleSelectPlaylist = (playlist) => {
    setSelectedPlaylist(playlist);
    loadPlaylistMusics(playlist.id);
  };

  const handlePlay = (music) => {
    setPlaylist(playlistMusics);
    setCurrentMusic(music);
  };

  const handleAddMusic = async (musicId) => {
    if (!selectedPlaylist) {
      message.error('请先选择一个歌单');
      return;
    }
    try {
      const response = await playlistApi.addMusicToPlaylist(selectedPlaylist.id, musicId);
      if (response.data.success) {
        message.success('添加成功');
        loadPlaylistMusics(selectedPlaylist.id);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error('添加失败');
    }
  };

  const handleRemoveMusic = async (musicId) => {
    try {
      await playlistApi.removeMusicFromPlaylist(selectedPlaylist.id, musicId);
      message.success('移除成功');
      loadPlaylistMusics(selectedPlaylist.id);
    } catch (error) {
      message.error('移除失败');
    }
  };

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      <div style={{ width: 300 }}>
        <Card
          title="我的歌单"
          extra={
            <Button
              type="primary"
              icon={<PlusOutlined />}
              size="small"
              onClick={() => setModalVisible(true)}
            >
              新建
            </Button>
          }
        >
          {playlists.length === 0 ? (
            <Empty description="暂无歌单" />
          ) : (
            <List
              dataSource={playlists}
              renderItem={(playlist) => (
                <List.Item
                  style={{
                    cursor: 'pointer',
                    background: selectedPlaylist?.id === playlist.id ? '#e6f7ff' : 'transparent',
                    padding: '8px 12px',
                    borderRadius: 4,
                  }}
                  onClick={() => handleSelectPlaylist(playlist)}
                >
                  <List.Item.Meta title={playlist.name} description={`${playlist.description || '暂无描述'}`} />
                </List.Item>
              )}
            />
          )}
        </Card>
      </div>

      <div style={{ flex: 1 }}>
        <Card title={selectedPlaylist?.name || '歌单详情'}>
          {!selectedPlaylist ? (
            <Empty description="请选择一个歌单" />
          ) : playlistMusics.length === 0 ? (
            <div>
              <Empty description="歌单暂无音乐" />
              <div style={{ marginTop: 16 }}>
                <h4>可添加的音乐：</h4>
                <List
                  dataSource={allMusics}
                  renderItem={(music) => (
                    <List.Item
                      actions={[
                        <Button
                          type="primary"
                          size="small"
                          onClick={() => handleAddMusic(music.id)}
                        >
                          添加
                        </Button>,
                      ]}
                    >
                      <List.Item.Meta title={music.title} description={music.artist} />
                    </List.Item>
                  )}
                />
              </div>
            </div>
          ) : (
            <List
              dataSource={playlistMusics}
              renderItem={(music) => (
                <List.Item
                  actions={[
                    <Button
                      type="text"
                      icon={<PlayCircleOutlined />}
                      onClick={() => handlePlay(music)}
                    >
                      播放
                    </Button>,
                    <Popconfirm
                      title="确定要移除吗？"
                      onConfirm={() => handleRemoveMusic(music.id)}
                    >
                      <Button type="text" danger icon={<DeleteOutlined />}>
                        移除
                      </Button>
                    </Popconfirm>,
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
                    title={music.title}
                    description={music.artist}
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      </div>

      <Modal
        title="新建歌单"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleCreatePlaylist}>
          <Form.Item
            name="name"
            label="歌单名称"
            rules={[{ required: true, message: '请输入歌单名称' }]}
          >
            <Input placeholder="请输入歌单名称" />
          </Form.Item>

          <Form.Item name="description" label="描述">
            <TextArea rows={3} placeholder="请输入歌单描述" />
          </Form.Item>

          <Form.Item name="isPublic" label="公开歌单" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={() => setModalVisible(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              创建
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Playlists;
