import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FONTS = [
  { id: '楷体', name: '楷书 (KaiTi)', description: '端庄秀丽，标准楷书' },
  { id: '行书', name: '行书 (XingShu)', description: '流畅自然，书写快捷' },
  { id: '隶书', name: '隶书 (LiShu)', description: '古朴典雅，结构规整' }
];

const COMMON_CHARACTERS = [
  '一', '二', '三', '十', '人', '大', '小', '口',
  '日', '月', '水', '火', '木', '山', '田', '中',
  '上', '下', '天', '地', '王', '土', '子', '女',
  '父', '母', '手', '目', '耳', '口', '心', '马'
];

function CharacterSelector({ onSelect }) {
  const [selectedFont, setSelectedFont] = useState('楷体');
  const [customCharacter, setCustomCharacter] = useState('');
  const [previewImage, setPreviewImage] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedCharacter) {
      generatePreview();
    }
  }, [selectedFont, selectedCharacter]);

  const generatePreview = async () => {
    if (!selectedCharacter) return;

    setLoading(true);
    try {
      const response = await axios.post('/api/generate-character', {
        character: selectedCharacter,
        font: selectedFont,
        grid_size: 200,
        show_grid: true,
        show_stroke: true
      });

      if (response.data.success) {
        setPreviewImage(`data:image/png;base64,${response.data.image}`);
      }
    } catch (error) {
      console.error('生成预览失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCharacterClick = (char) => {
    setSelectedCharacter(char);
    setCustomCharacter(char);
  };

  const handleCustomInput = (e) => {
    const value = e.target.value;
    setCustomCharacter(value);
    if (value) {
      setSelectedCharacter(value);
    }
  };

  const handleConfirm = () => {
    if (selectedCharacter && selectedFont) {
      onSelect(selectedCharacter, selectedFont);
    }
  };

  return (
    <div className="card">
      <h2 className="section-title">选择字体和汉字</h2>

      <div className="form-group">
        <label className="form-label">选择字体</label>
        <div className="font-selector">
          {FONTS.map((font) => (
            <div
              key={font.id}
              className={`font-option ${selectedFont === font.id ? 'selected' : ''}`}
              onClick={() => setSelectedFont(font.id)}
            >
              <h3>{font.name}</h3>
              <p>{font.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">输入或选择汉字</label>
        <input
          type="text"
          className="form-input"
          placeholder="输入单个汉字..."
          value={customCharacter}
          onChange={handleCustomInput}
          maxLength={1}
        />
      </div>

      <div className="form-group">
        <label className="form-label">常用汉字</label>
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '10px',
          padding: '10px',
          background: '#fafafa',
          borderRadius: '8px'
        }}>
          {COMMON_CHARACTERS.map((char) => (
            <button
              key={char}
              onClick={() => handleCharacterClick(char)}
              style={{
                width: '45px',
                height: '45px',
                fontSize: '20px',
                border: selectedCharacter === char 
                  ? '2px solid #667eea' 
                  : '1px solid #ddd',
                borderRadius: '8px',
                background: selectedCharacter === char ? '#f5f7ff' : 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              {char}
            </button>
          ))}
        </div>
      </div>

      {selectedCharacter && (
        <div className="form-group">
          <label className="form-label">预览</label>
          <div className="character-display">
            {loading ? (
              <div className="loading-overlay" style={{ position: 'relative' }}>
                <div className="spinner"></div>
              </div>
            ) : previewImage ? (
              <img src={previewImage} alt="预览" />
            ) : (
              <div style={{ fontSize: '120px', color: '#333' }}>
                {selectedCharacter}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="btn-group">
        <button
          className="btn btn-primary"
          onClick={handleConfirm}
          disabled={!selectedCharacter}
        >
          确认选择
        </button>
      </div>
    </div>
  );
}

export default CharacterSelector;
