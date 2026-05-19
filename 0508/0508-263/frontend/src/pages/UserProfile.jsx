import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Avatar, Typography, Tabs, List, Empty, Button, Modal, Form, Input, message } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import { userApi, musicApi } from '../services/api';
import useAuthStore from '../store/useAuthStore';
import usePlayerStore from '../store/usePlayerStore';

const { Title } = Typography;
const { TextArea } = Input;

const UserProfile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState(null);
  const [uploadedMusics, setUploadedMusics] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const { user } = useAuthStore();
  const setCurrentMusic = usePlayerStore(state => state.setCurrentMusic);

  useEffect(() => {
    loadProfile();
    loadUploadedMusics();
  }, [id]);

  const loadProfile = async () => {
    try {
      const response = await userApi.getProfile();
      if (response.data.success) {
        setProfile(response.data.data);
        form.setFieldsValue({
          nickname: response.data.data.nickname,
          bio: response.data.data.bio,
        });
      }
    } catch (error) {
      console.error('加载用户信息失败', error);
    }
  };

  const loadUploadedMusics = async () => {
    try {
      const response = await musicApi.getMyUploads();
      if (response.data.success) {
        setUploadedMusics(response.data.data);
      }
    } catch (error) {
      console.error('加载上传音乐失败', error);
    }
  };

  const handleUpdateProfile = async (values) => {
    try {
      const response = await userApi.updateProfile(values);
      if (response.data.success) {
        message.success('更新成功');
        setModalVisible(false);
        loadProfile();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error('更新失败');
    }
  };

  const handlePlay = (music) => {
    setCurrentMusic(music);
  };

  const tabItems = [
    {
      key: 'uploaded',
      label: '上传的音乐',
      children: uploadedMusics.length === 0 ? (
        <Empty description="暂无上传的音乐" />
      ) : (
        <List
          dataSource={uploadedMusics}
          renderItem={(music) => (
            <List.Item
              actions={[
                <Button type="text" onClick={() => handlePlay(music)}>
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
                    {music.title}
                    <span style={{ marginLeft: 8, fontSize: 12, color:
                      music.status === 'APPROVED' ? '#52c41a' :
                      music.status === 'PENDING' ? '#faad14' : '#ff4d4f'
                    }}>
                      [{music.status === 'APPROVED' ? '已通过' : music.status === 'PENDING' ? '审核中' : '已拒绝'}]
                    </span>
                  </span>
                }
                description={music.artist || '未知艺术家'}
              />
            </List.Item>
          )}
        />
      ),
    },
  ];

  if (!profile) {
    return <Empty description="用户不存在" />;
  }

  const isOwnProfile = user?.id?.toString() === id;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
          <Avatar size={100} src={profile.avatar}>
            {profile.nickname?.charAt(0) || profile.username?.charAt(0)}
          </Avatar>
          <div style={{ flex: 1 }}>
            <Title level={2}>{profile.nickname || profile.username}</Title>
            <p style={{ color: '#888' }}>@{profile.username}</p>
            {profile.bio && <p>{profile.bio}</p>}
            {isOwnProfile && (
              <Button
                icon={<EditOutlined />}
                onClick={() => setModalVisible(true)}
              >
                编辑资料
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultActiveKey="uploaded" items={tabItems} />
      </Card>

      <Modal
        title="编辑资料"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleUpdateProfile}>
          <Form.Item name="nickname" label="昵称">
            <Input placeholder="请输入昵称" />
          </Form.Item>

          <Form.Item name="bio" label="个人简介">
            <TextArea rows={4} placeholder="介绍一下自己..." />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Button onClick={() => setModalVisible(false)} style={{ marginRight: 8 }}>
              取消
            </Button>
            <Button type="primary" htmlType="submit">
              保存
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserProfile;
