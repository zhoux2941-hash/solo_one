import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Button, List, Comment, Avatar, Form, Input, Typography, Tag, message, Empty } from 'antd';
import { PlayCircleOutlined, SendOutlined } from '@ant-design/icons';
import { musicApi, commentApi } from '../services/api';
import usePlayerStore from '../store/usePlayerStore';
import useAuthStore from '../store/useAuthStore';

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

const MusicDetail = () => {
  const { id } = useParams();
  const [music, setMusic] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [commentForm] = Form.useForm();
  const setCurrentMusic = usePlayerStore(state => state.setCurrentMusic);
  const { user } = useAuthStore();

  useEffect(() => {
    loadMusicDetail();
    loadComments();
  }, [id]);

  const loadMusicDetail = async () => {
    try {
      const response = await musicApi.getMusic(id);
      if (response.data.success) {
        setMusic(response.data.data);
      }
    } catch (error) {
      console.error('加载音乐详情失败', error);
    }
  };

  const loadComments = async () => {
    try {
      const response = await commentApi.getMusicComments(id);
      if (response.data.success) {
        setComments(response.data.data);
      }
    } catch (error) {
      console.error('加载评论失败', error);
    }
  };

  const handlePlay = () => {
    if (music) {
      setCurrentMusic(music);
    }
  };

  const handleSubmitComment = async (values) => {
    setLoading(true);
    try {
      const response = await commentApi.createComment({
        musicId: id,
        content: values.content,
      });
      if (response.data.success) {
        message.success('评论成功');
        commentForm.resetFields();
        loadComments();
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error('评论失败');
    }
    setLoading(false);
  };

  if (!music) {
    return <Empty description="音乐不存在" />;
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card>
        <div style={{ display: 'flex', gap: 24, marginBottom: 24 }}>
          <img
            src={music.cover ? `/api/files/cover/${music.cover}` : 'https://via.placeholder.com/200'}
            alt={music.title}
            style={{ width: 200, height: 200, borderRadius: 8 }}
          />
          <div style={{ flex: 1 }}>
            <Title level={2}>{music.title}</Title>
            <p style={{ fontSize: 16, marginBottom: 8 }}>
              <strong>艺术家：</strong>{music.artist || '未知'}
            </p>
            <p style={{ marginBottom: 8 }}>
              <strong>专辑：</strong>{music.album || '未知'}
            </p>
            <p style={{ marginBottom: 16 }}>
              {music.tags && music.tags.split(',').map((tag, i) => (
                <Tag key={i} color="blue">{tag}</Tag>
              ))}
            </p>
            <p style={{ marginBottom: 16 }}>
              <strong>播放次数：</strong>{music.playCount || 0}
            </p>
            <Button
              type="primary"
              size="large"
              icon={<PlayCircleOutlined />}
              onClick={handlePlay}
            >
              播放
            </Button>
          </div>
        </div>

        {music.description && (
          <div style={{ marginBottom: 24 }}>
            <Title level={4}>简介</Title>
            <Paragraph>{music.description}</Paragraph>
          </div>
        )}

        <div>
          <Title level={4}>评论 ({comments.length})</Title>

          {user && (
            <Form
              form={commentForm}
              onFinish={handleSubmitComment}
              style={{ marginBottom: 24 }}
            >
              <Form.Item
                name="content"
                rules={[{ required: true, message: '请输入评论内容' }]}
              >
                <TextArea rows={3} placeholder="写下你的评论..." />
              </Form.Item>
              <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  icon={<SendOutlined />}
                >
                  发表评论
                </Button>
              </Form.Item>
            </Form>
          )}

          <List
            dataSource={comments}
            renderItem={(comment) => (
              <Comment
                author={comment.userName}
                avatar={<Avatar src={comment.userAvatar}>{comment.userName?.charAt(0)}</Avatar>}
                content={comment.content}
                datetime={new Date(comment.createdAt).toLocaleString()}
              />
            )}
          />
        </div>
      </Card>
    </div>
  );
};

export default MusicDetail;
