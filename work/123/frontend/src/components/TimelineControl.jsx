import React, { useState, useEffect, useRef } from 'react';
import { Button, Slider, Select, Space } from 'antd';
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  FastForwardOutlined,
  StepForwardOutlined,
  StepBackwardOutlined
} from '@ant-design/icons';
import useAppStore from '../store/appStore';

const { Option } = Select;

function TimelineControl() {
  const {
    visualization,
    setVisualization,
    results,
    currentSimulation
  } = useAppStore();

  const animationRef = useRef(null);
  const lastTimeRef = useRef(null);

  const {
    isPlaying,
    currentTime,
    totalTime,
    playbackSpeed
  } = visualization;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    if (totalTime === 0) return;
    setVisualization({ isPlaying: !isPlaying });
  };

  const handleStepForward = () => {
    const newTime = Math.min(currentTime + 1, totalTime);
    setVisualization({ currentTime: newTime });
  };

  const handleStepBackward = () => {
    const newTime = Math.max(currentTime - 1, 0);
    setVisualization({ currentTime: newTime });
  };

  const handleSliderChange = (value) => {
    setVisualization({ currentTime: value });
  };

  const handleSpeedChange = (value) => {
    setVisualization({ playbackSpeed: value });
  };

  useEffect(() => {
    if (isPlaying && totalTime > 0) {
      lastTimeRef.current = performance.now();
      
      const animate = (currentTime) => {
        if (!lastTimeRef.current) {
          lastTimeRef.current = currentTime;
        }

        const deltaTime = (currentTime - lastTimeRef.current) / 1000;
        lastTimeRef.current = currentTime;

        setVisualization(prev => {
          const newTime = prev.currentTime + deltaTime * playbackSpeed;
          
          if (newTime >= prev.totalTime) {
            return {
              currentTime: prev.totalTime,
              isPlaying: false
            };
          }
          
          return {
            currentTime: newTime
          };
        });

        animationRef.current = requestAnimationFrame(animate);
      };

      animationRef.current = requestAnimationFrame(animate);
    } else {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      lastTimeRef.current = null;
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, playbackSpeed, totalTime, setVisualization]);

  useEffect(() => {
    if (results.statistics && totalTime === 0) {
      setVisualization({
        totalTime: results.statistics.totalTrips > 0 ? 3600 : 0
      });
    }
  }, [results, totalTime, setVisualization]);

  if (!currentSimulation || totalTime === 0) {
    return null;
  }

  return (
    <div className="timeline-control">
      <Space>
        <Button
          className="play-btn"
          icon={<StepBackwardOutlined />}
          onClick={handleStepBackward}
          disabled={currentTime <= 0}
        />

        <Button
          className="play-btn"
          icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          onClick={handlePlayPause}
        />

        <Button
          className="play-btn"
          icon={<StepForwardOutlined />}
          onClick={handleStepForward}
          disabled={currentTime >= totalTime}
        />

        <div className="time-display">
          {formatTime(currentTime)} / {formatTime(totalTime)}
        </div>

        <Slider
          style={{ width: 200 }}
          min={0}
          max={totalTime}
          step={1}
          value={currentTime}
          onChange={handleSliderChange}
          tooltip={{ formatter: formatTime }}
        />

        <Select
          value={playbackSpeed}
          onChange={handleSpeedChange}
          style={{ width: 80 }}
        >
          <Option value={0.5}>0.5x</Option>
          <Option value={1}>1x</Option>
          <Option value={2}>2x</Option>
          <Option value={5}>5x</Option>
          <Option value={10}>10x</Option>
        </Select>
      </Space>
    </div>
  );
}

export default TimelineControl;
