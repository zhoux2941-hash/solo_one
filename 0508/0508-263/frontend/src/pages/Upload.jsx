import React, { useState } from 'react';
import { Form, Input, Button, Upload, Card, message, Space } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { musicApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

const { TextArea } = Input;

const UploadMusic = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [musicFile, setMusicFile] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (values) => {
    if (!musicFile) {
      message.error('请选择音乐文件');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('artist', values.artist || '');
      formData.append('album', values.album || '');
      formData.append('tags', values.tags || '');
      formData.append('description', values.description || '');
      formData.append('musicFile', musicFile);
      if (coverFile) {
        formData.append('coverFile', coverFile);
      }

      const response = await musicApi.uploadMusic(formData);
      if (response.data.success) {
        message.success('上传成功，等待管理员审核');
        navigate('/');
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      message.error('上传失败');
    }
    setLoading(false);
  };

  const musicProps = {
    beforeUpload: (file) => {
      const isAudio = file.type.startsWith('audio/');
      if (!isAudio) {
        message.error('只能上传音频文件');
      }
      setMusicFile(file);
      return false;
    },
    onRemove: () => {
      setMusicFile(null);
    },
    fileList: musicFile ? [musicFile] : [],
  };

  const coverProps = {
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('只能上传图片文件');
      }
      setCoverFile(file);
      return false;
    },
    onRemove: () => {
      setCoverFile(null);
    },
    fileList: coverFile ? [coverFile] : [],
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Card title="上传音乐">
        <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          name="title"
          label="歌曲名称"
          rules={[{ required: true, message: '请输入歌曲名称' }]}
        >
          <Input placeholder="请输入歌曲名称" />
        </Form.Item>

        <Form.Item
          name="artist"
          label="艺术家"
        >
          <Input placeholder="请输入艺术家名称" />
        </Form.Item>

        <Form.Item
          name="album"
          label="专辑"
        >
          <Input placeholder="请输入专辑名称" />
        </Form.Item>

        <Form.Item
          name="tags"
          label="标签"
        >
          <Input placeholder="多个标签用逗号分隔，如：流行,摇滚,华语" />
        </Form.Item>

        <Form.Item
          name="description"
          label="描述"
        >
          <TextArea rows={4} placeholder="请输入音乐描述" />
        </Form.Item>

        <Form.Item label="音乐文件" required>
          <Upload {...musicProps} maxCount={1}>
            <Button icon={<UploadOutlined />}>选择音乐文件</Button>
          </Upload>
        </Form.Item>

        <Form.Item label="封面图片">
          <Upload {...coverProps} maxCount={1} accept="image/*">
            <Button icon={<UploadOutlined />}>选择封面图片</Button>
          </Upload>
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              上传
            </Button>
            <Button onClick={() => navigate('/')}>取消</Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
    </div >
  );
};

export default UploadMusic;
