import React, { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';

function PracticeEvaluator({ referenceCharacter, referenceFont }) {
  const [referenceImage, setReferenceImage] = useState('');
  const [userImage, setUserImage] = useState('');
  const [userImageBase64, setUserImageBase64] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (referenceCharacter) {
      generateReference();
    }
  }, [referenceCharacter, referenceFont]);

  const generateReference = async () => {
    try {
      const response = await axios.post('/api/generate-character', {
        character: referenceCharacter,
        font: referenceFont,
        grid_size: 200,
        show_grid: true,
        show_stroke: true
      });

      if (response.data.success) {
        setReferenceImage(response.data.image);
      }
    } catch (error) {
      console.error('生成参考字帖失败:', error);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target.result.split(',')[1];
      setUserImageBase64(base64Data);
      setUserImage(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handlePaste = useCallback((e) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            processFile(file);
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);

  const startCamera = async () => {
    setShowCamera(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('无法访问摄像头:', error);
      alert('无法访问摄像头，请检查权限设置');
      setShowCamera(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject;
      stream.getTracks().forEach(track => track.stop());
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      
      const dataUrl = canvas.toDataURL('image/png');
      const base64Data = dataUrl.split(',')[1];
      
      setUserImageBase64(base64Data);
      setUserImage(dataUrl);
      
      stopCamera();
    }
  };

  const evaluateImage = async () => {
    if (!referenceImage || !userImageBase64) {
      alert('请先选择参考汉字并上传临摹作品');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const startTime = performance.now();
      
      const response = await axios.post('/api/calculate-similarity', {
        reference_image: referenceImage,
        user_image: userImageBase64
      });

      const endTime = performance.now();
      const totalTime = ((endTime - startTime) / 1000).toFixed(2);

      if (response.data.success) {
        setResult({
          ...response.data,
          total_time: totalTime
        });
      } else {
        alert('评分失败，请重试');
      }
    } catch (error) {
      console.error('评分失败:', error);
      alert('评分失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setUserImage('');
    setUserImageBase64('');
    setResult(null);
  };

  const getScoreClass = (score) => {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-average';
    return 'score-poor';
  };

  const getScoreLabel = (score) => {
    if (score >= 90) return '优秀';
    if (score >= 80) return '良好';
    if (score >= 60) return '及格';
    if (score >= 40) return '需努力';
    return '继续加油';
  };

  const getFeedback = (result) => {
    const feedbacks = [];
    
    if (result.structure_score < 60) {
      feedbacks.push('整体结构需要改进，注意笔画的位置关系');
    }
    
    if (result.shape_score < 60) {
      feedbacks.push('笔画形状与原帖有差异，注意观察笔画的走向');
    }
    
    if (result.correlation_score < 60) {
      feedbacks.push('笔画的位置和比例需要调整');
    }

    if (result.thickness_score !== undefined && result.thickness_score < 60) {
      feedbacks.push('笔画粗细与原帖差异较大，注意控制用笔力度');
    }

    if (feedbacks.length === 0) {
      feedbacks.push('临摹效果很好，继续保持！');
    }

    return feedbacks;
  };

  return (
    <div className="card">
      <h2 className="section-title">临摹评分</h2>

      {!referenceCharacter && (
        <div style={{ 
          padding: '20px', 
          background: '#fff3cd', 
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          请先在"选择汉字"页面选择要练习的汉字
        </div>
      )}

      {referenceCharacter && referenceImage && (
        <div className="form-group">
          <label className="form-label">参考字帖 - {referenceCharacter}</label>
          <div className="comparison-view">
            <div className="comparison-item">
              <h3>原帖</h3>
              <img 
                src={`data:image/png;base64,${referenceImage}`} 
                alt="参考字帖" 
                style={{ maxWidth: '200px' }}
              />
            </div>
            
            {userImage && (
              <div className="comparison-item">
                <h3>你的作品</h3>
                <img 
                  src={userImage} 
                  alt="临摹作品" 
                  style={{ maxWidth: '200px' }}
                />
              </div>
            )}

            {result?.overlay_image && (
              <div className="comparison-item">
                <h3>对比分析</h3>
                <img 
                  src={`data:image/png;base64,${result.overlay_image}`} 
                  alt="对比分析" 
                  style={{ maxWidth: '200px' }}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {!showCamera ? (
        <div className="upload-section">
          <div
            className={`upload-area ${isDragging ? 'dragging' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="upload-icon">📷</div>
            <div className="upload-text">
              {userImage ? '点击更换图片' : '点击或拖拽上传临摹作品'}
            </div>
            <div className="upload-text" style={{ fontSize: '12px', marginTop: '5px' }}>
              支持拍照或从相册选择
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button 
              className="btn btn-secondary"
              onClick={startCamera}
            >
              📸 拍照
            </button>
            {userImage && (
              <button 
                className="btn btn-secondary"
                onClick={resetAll}
              >
                清除
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="upload-section">
          <div className="camera-container">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ width: '100%', display: 'block' }}
            />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
              className="btn btn-primary"
              onClick={capturePhoto}
            >
              📸 拍摄
            </button>
            <button 
              className="btn btn-secondary"
              onClick={stopCamera}
            >
              取消
            </button>
          </div>
        </div>
      )}

      {userImage && !result && (
        <div className="btn-group">
          <button
            className="btn btn-primary"
            onClick={evaluateImage}
            disabled={loading}
          >
            {loading ? '评分中...' : '开始评分'}
          </button>
        </div>
      )}

      {loading && (
        <div className="loading-overlay">
          <div className="spinner"></div>
        </div>
      )}

      {result && (
        <div className="score-display">
          <div className={`score-circle ${getScoreClass(result.score)}`}>
            <div className="score-value">{result.score}</div>
            <div className="score-label">{getScoreLabel(result.score)}</div>
          </div>

          <div className="score-details">
            <div className="score-detail-item">
              <h4>结构得分</h4>
              <div className="value">{result.structure_score}</div>
            </div>
            <div className="score-detail-item">
              <h4>形状得分</h4>
              <div className="value">{result.shape_score}</div>
            </div>
            <div className="score-detail-item">
              <h4>粗细得分</h4>
              <div className="value">{result.thickness_score || 0}</div>
            </div>
            <div className="score-detail-item">
              <h4>相关度</h4>
              <div className="value">{result.correlation_score}</div>
            </div>
            <div className="score-detail-item">
              <h4>处理时间</h4>
              <div className="value" style={{ fontSize: '16px' }}>
                {result.total_time || result.processing_time}s
              </div>
            </div>
          </div>

          <div className="feedback-section">
            <h3>💡 改进建议</h3>
            <ul>
              {getFeedback(result).map((feedback, index) => (
                <li key={index}>{feedback}</li>
              ))}
            </ul>
          </div>

          {result.difference_regions?.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ fontSize: '16px', color: '#555', marginBottom: '10px' }}>
                差异区域 ({result.difference_regions.length}处)
              </h3>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '10px',
                justifyContent: 'center'
              }}>
                {result.difference_regions.slice(0, 8).map((region, index) => (
                  <div
                    key={index}
                    style={{
                      width: '40px',
                      height: '40px',
                      border: '2px solid #ff0000',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      color: '#ff0000'
                    }}
                  >
                    {index + 1}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="btn-group" style={{ justifyContent: 'center' }}>
            <button
              className="btn btn-secondary"
              onClick={resetAll}
            >
              重新上传
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PracticeEvaluator;
