import React, { useRef, useEffect } from 'react';
import { Slider, Button, Space, Typography } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  VolumeUpOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import usePlayerStore from '../store/usePlayerStore';
import { shareApi } from '../services/api';
import { message } from 'antd';

const { Text } = Typography;

const MusicPlayer = () => {
  const audioRef = useRef(null);
  const { currentMusic, isPlaying, volume, prev, next, play, pause, setVolume } = usePlayerStore();

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      if (isPlaying) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentMusic, volume]);

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleEnded = () => {
    next();
  };

  const handleShare = async () => {
    if (!currentMusic) return;
    try {
      const response = await shareApi.createShare({
        targetType: 'MUSIC',
        targetId: currentMusic.id,
      });
      if (response.data.success) {
        const shareUrl = `${window.location.origin}/share/${response.data.data}`;
        navigator.clipboard.writeText(shareUrl);
        message.success('分享链接已复制到剪贴板');
      }
    } catch (error) {
      message.error('分享失败');
    }
  };

  if (!currentMusic) {
    return (
      <div className="music-player">
        <Text type="secondary">未播放音乐</Text>
      </div>
    );
  }

  return (
    <div className="music-player">
      {currentMusic.filePath && (
        <audio
          ref={audioRef}
          src={`/api/files/music/${currentMusic.filePath}`}
          onEnded={handleEnded}
        />
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
          <div>
            <img
              src={currentMusic.cover ? `/api/files/cover/${currentMusic.cover}` : 'https://via.placeholder.com/48'}
              alt={currentMusic.title}
              style={{ width: 48, height: 48, borderRadius: 4 }}
            />
          </div>
          <div>
            <div style={{ fontWeight: 500 }}>{currentMusic.title}</div>
            <div style={{ fontSize: 12, color: '#888' }}>{currentMusic.artist}</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
          <Space>
            <Button type="text" icon={<StepBackwardOutlined />} onClick={prev} />
            <Button
              type="text"
              icon={isPlaying ? <PauseCircleOutlined style={{ fontSize: 32 }} /> : <PlayCircleOutlined style={{ fontSize: 32 }} />}
              onClick={handlePlayPause}
              style={{ fontSize: 32 }}
            />
            <Button type="text" icon={<StepForwardOutlined />} onClick={next} />
          </Space>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1, justifyContent: 'flex-end' }}>
          <Button type="text" icon={<ShareAltOutlined />} onClick={handleShare} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: 120 }}>
            <VolumeUpOutlined />
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={setVolume}
              style={{ flex: 1 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicPlayer;
