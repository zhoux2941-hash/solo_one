import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Slider, Button, Space, Typography, Tooltip, Modal, Select } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  VolumeUpOutlined,
  ShareAltOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import usePlayerStore from '../store/usePlayerStore';
import { shareApi } from '../services/api';
import { message } from 'antd';
import useAuthStore from '../store/useAuthStore';

const { Text } = Typography;

const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const GlobalMusicPlayer = () => {
  const audioRef = useRef(null);
  const { isAuthenticated } = useAuthStore();
  const [currentSrc, setCurrentSrc] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragValue, setDragValue] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isBuffering, setIsBuffering] = useState(false);
  const [bufferProgress, setBufferProgress] = useState(0);
  
  const {
    currentMusic,
    playlist,
    currentIndex,
    isPlaying,
    volume,
    prev,
    next,
    play,
    pause,
    setVolume,
  } = usePlayerStore();

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const handleEnded = useCallback(() => {
    setRetryCount(0);
    next();
  }, [next]);

  const handleTimeUpdate = useCallback(() => {
    if (!isDragging && !isSeeking && audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, [isDragging, isSeeking]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      setRetryCount(0);
    }
  }, []);

  const handleSeeked = useCallback(() => {
    setIsSeeking(false);
  }, []);

  const handleWaiting = useCallback(() => {
    setIsBuffering(true);
  }, []);

  const handlePlaying = useCallback(() => {
    setIsBuffering(false);
    setRetryCount(0);
  }, []);

  const handleProgress = useCallback(() => {
    if (audioRef.current && audioRef.current.buffered.length > 0) {
      const bufferedEnd = audioRef.current.buffered.end(audioRef.current.buffered.length - 1);
      const duration = audioRef.current.duration;
      if (duration > 0) {
        setBufferProgress((bufferedEnd / duration) * 100);
      }
    }
  }, []);

  const handleError = useCallback(() => {
    console.error('Audio playback error, retry count:', retryCount);
    
    if (retryCount < 3) {
      const currentAudioTime = currentTime;
      setTimeout(() => {
        if (audioRef.current && currentSrc) {
          audioRef.current.src = currentSrc + '?t=' + Date.now();
          audioRef.current.currentTime = currentAudioTime;
          if (isPlaying) {
            audioRef.current.play().catch(() => {});
          }
          setRetryCount(prev => prev + 1);
        }
      }, 1000 * (retryCount + 1));
    }
  }, [retryCount, currentTime, currentSrc, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch(err => {
        console.log('自动播放被阻止:', err);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentMusic) return;

    const expectedSrc = `/api/files/music/${currentMusic.filePath}`;

    if (currentSrc !== expectedSrc) {
      const wasPlaying = isPlaying;
      audio.src = expectedSrc;
      setCurrentSrc(expectedSrc);
      setCurrentTime(0);
      setDuration(0);
      
      if (wasPlaying) {
        audio.play().catch(err => {
          console.log('自动播放被阻止:', err);
        });
      }
    }
  }, [currentMusic, currentSrc, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.volume = volume;
    }
  }, [volume]);

  const handleProgressChange = useCallback((value) => {
    setDragValue(value);
  }, []);

  const handleProgressDragStart = useCallback(() => {
    setIsDragging(true);
    setIsSeeking(true);
  }, []);

  const handleProgressDragEnd = useCallback((value) => {
    if (audioRef.current && duration > 0) {
      const newTime = (value / 100) * duration;
      
      try {
        audioRef.current.currentTime = newTime;
        
        const checkSeek = setInterval(() => {
          if (audioRef.current && !audioRef.current.seeking) {
            setCurrentTime(audioRef.current.currentTime);
            setIsSeeking(false);
            clearInterval(checkSeek);
          }
        }, 50);
        
        setTimeout(() => {
          clearInterval(checkSeek);
          setIsSeeking(false);
        }, 2000);
      } catch (error) {
        console.error('Seek error:', error);
        setIsSeeking(false);
      }
    }
    setIsDragging(false);
  }, [duration]);

  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedExpire, setSelectedExpire] = useState(24);
  const [createdShareUrl, setCreatedShareUrl] = useState(null);

  const expireOptions = [
    { label: '1 小时', value: 1, icon: <ClockCircleOutlined /> },
    { label: '1 天', value: 24, icon: <ClockCircleOutlined /> },
    { label: '7 天', value: 168, icon: <ClockCircleOutlined /> },
    { label: '30 天', value: 720, icon: <ClockCircleOutlined /> },
    { label: '永久', value: -1, icon: <CheckCircleOutlined /> },
  ];

  const handleShare = () => {
    if (!currentMusic) return;
    setShareModalVisible(true);
    setCreatedShareUrl(null);
  };

  const handleCreateShare = async () => {
    try {
      const response = await shareApi.createShare({
        targetType: 'MUSIC',
        targetId: currentMusic.id,
        expireHours: selectedExpire,
      });
      if (response.data.success) {
        const shareUrl = `${window.location.origin}/share/${response.data.data}`;
        setCreatedShareUrl(shareUrl);
        navigator.clipboard.writeText(shareUrl);
        message.success('分享链接已复制到剪贴板');
      }
    } catch (error) {
      message.error('分享失败');
    }
  };

  const copyShareUrl = () => {
    if (createdShareUrl) {
      navigator.clipboard.writeText(createdShareUrl);
      message.success('链接已复制');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const displayProgress = isDragging ? dragValue : progress;
  const step = duration > 3600 ? 0.01 : 0.1;

  return (
    <div>
      <audio
        ref={audioRef}
        onEnded={handleEnded}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onSeeked={handleSeeked}
        onWaiting={handleWaiting}
        onPlaying={handlePlaying}
        onProgress={handleProgress}
        onError={handleError}
        onStalled={handleWaiting}
        preload="auto"
        crossOrigin="anonymous"
        style={{ display: 'none' }}
      />
      <div
        className="music-player"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#fff',
          borderTop: '1px solid #e8e8e8',
          padding: '8px 24px 12px 24px',
          zIndex: 1000,
        }}
      >
        {!currentMusic ? (
          <Text type="secondary">未播放音乐</Text>
        ) : (
          <div>
            <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 12, color: '#666', minWidth: 45, textAlign: 'right' }}>
                {formatTime(currentTime)}
                {isBuffering && <span style={{ marginLeft: 4 }}>⟳</span>}
              </Text>
              <div style={{ flex: 1, position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    right: 0,
                    height: 4,
                    transform: 'translateY(-50%)',
                    background: `linear-gradient(to right, #d9d9d9 ${bufferProgress}%, #f0f0f0 ${bufferProgress}%)`,
                    borderRadius: 2,
                    zIndex: 0,
                  }}
                />
                <Slider
                  min={0}
                  max={100}
                  step={step}
                  value={displayProgress}
                  onChange={handleProgressChange}
                  onBeforeChange={handleProgressDragStart}
                  onAfterChange={handleProgressDragEnd}
                  style={{ flex: 1 }}
                  tooltip={{
                    formatter: (value) => {
                      const time = duration > 0 ? (value / 100) * duration : 0;
                      return formatTime(time);
                    },
                  }}
                />
              </div>
              <Text style={{ fontSize: 12, color: '#666', minWidth: 45 }}>
                {formatTime(duration)}
                {retryCount > 0 && (
                  <span style={{ marginLeft: 4, color: '#faad14' }}>
                    重试{retryCount}
                  </span>
                )}
              </Text>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: 1 }}>
                <div>
                  <img
                    src={currentMusic.cover ? `/api/files/cover/${currentMusic.cover}` : 'https://via.placeholder.com/48'}
                    alt={currentMusic.title}
                    style={{ width: 48, height: 48, borderRadius: 4, objectFit: 'cover' }}
                  />
                </div>
                <div>
                  <div style={{ fontWeight: 500 }}>{currentMusic.title}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{currentMusic.artist || '未知艺术家'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                <Space>
                  <Button
                    type="text"
                    icon={<StepBackwardOutlined />}
                    onClick={prev}
                    disabled={playlist.length <= 1}
                  />
                  <Button
                    type="text"
                    icon={isPlaying ? <PauseCircleOutlined style={{ fontSize: 32 }} /> : <PlayCircleOutlined style={{ fontSize: 32 }} />}
                    onClick={handlePlayPause}
                    style={{ fontSize: 32 }}
                  />
                  <Button
                    type="text"
                    icon={<StepForwardOutlined />}
                    onClick={next}
                    disabled={playlist.length <= 1}
                  />
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
        )}
      </div>

      <Modal
        title="分享音乐"
        open={shareModalVisible}
        onCancel={() => setShareModalVisible(false)}
        footer={null}
        width={400}
      >
        {currentMusic && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <img
                src={currentMusic.cover ? `/api/files/cover/${currentMusic.cover}` : 'https://via.placeholder.com/64'}
                alt={currentMusic.title}
                style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover' }}
              />
              <div>
                <div style={{ fontSize: 16, fontWeight: 500 }}>{currentMusic.title}</div>
                <div style={{ color: '#666' }}>{currentMusic.artist || '未知艺术家'}</div>
              </div>
            </div>

            {!createdShareUrl ? (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ marginBottom: 8, fontWeight: 500 }}>选择有效期：</div>
                  <Select
                    value={selectedExpire}
                    onChange={setSelectedExpire}
                    style={{ width: '100%' }}
                    options={expireOptions}
                  />
                </div>
                <Button
                  type="primary"
                  block
                  onClick={handleCreateShare}
                  icon={<ShareAltOutlined />}
                >
                  生成分享链接
                </Button>
              </>
            ) : (
              <>
                <div style={{
                  padding: 12,
                  background: '#f6ffed',
                  border: '1px solid #b7eb8f',
                  borderRadius: 4,
                  marginBottom: 16,
                }}>
                  <div style={{ color: '#52c41a', marginBottom: 8, fontWeight: 500 }}>
                    ✅ 分享链接已生成
                  </div>
                  <div
                    style={{
                      wordBreak: 'break-all',
                      fontSize: 13,
                      color: '#666',
                      padding: 8,
                      background: '#fff',
                      borderRadius: 4,
                    }}
                  >
                    {createdShareUrl}
                  </div>
                </div>
                <Space style={{ width: '100%' }}>
                  <Button
                    type="primary"
                    block
                    onClick={copyShareUrl}
                  >
                    复制链接
                  </Button>
                  <Button
                    block
                    onClick={() => setCreatedShareUrl(null)}
                  >
                    重新生成
                  </Button>
                </Space>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default GlobalMusicPlayer;
