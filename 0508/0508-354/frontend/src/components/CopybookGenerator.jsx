import React, { useState, useEffect } from 'react';
import axios from 'axios';

function CopybookGenerator({ defaultFont = '楷体', defaultCharacters = '' }) {
  const [font, setFont] = useState(defaultFont);
  const [characters, setCharacters] = useState(defaultCharacters);
  const [columns, setColumns] = useState(8);
  const [rows, setRows] = useState(11);
  const [previewImage, setPreviewImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    if (characters) {
      generatePreview();
    }
  }, [font, characters, columns, rows]);

  const generatePreview = async () => {
    if (!characters) return;

    setLoading(true);
    try {
      const charList = characters.split('').filter(c => c.trim());
      
      const response = await axios.post('/api/generate-copybook', {
        characters: charList,
        font: font,
        cols: columns,
        rows: rows,
        cell_size: 80
      });

      if (response.data.success) {
        setPreviewImage(`data:image/png;base64,${response.data.image}`);
      }
    } catch (error) {
      console.error('生成字帖预览失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePdf = async () => {
    if (!characters) return;

    setGeneratingPdf(true);
    try {
      const charList = characters.split('').filter(c => c.trim());

      const response = await axios.post('/api/generate-pdf', {
        characters: charList,
        font: font,
        cols: columns,
        rows: rows
      }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'copybook.pdf');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('生成PDF失败:', error);
      alert('生成PDF失败，请重试');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleCharactersChange = (e) => {
    setCharacters(e.target.value);
  };

  return (
    <div className="card">
      <h2 className="section-title">生成描红字帖</h2>

      <div className="form-group">
        <label className="form-label">选择字体</label>
        <select
          className="form-input"
          value={font}
          onChange={(e) => setFont(e.target.value)}
        >
          <option value="楷体">楷书 (KaiTi)</option>
          <option value="行书">行书 (XingShu)</option>
          <option value="隶书">隶书 (LiShu)</option>
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">输入汉字（可输入多个）</label>
        <textarea
          className="form-input"
          placeholder="输入要练习的汉字，例如：天地玄黄..."
          value={characters}
          onChange={handleCharactersChange}
          rows={3}
          style={{ resize: 'vertical' }}
        />
        <p style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
          已输入 {characters.length} 个汉字
        </p>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">列数</label>
          <input
            type="number"
            className="form-input"
            min="1"
            max="15"
            value={columns}
            onChange={(e) => setColumns(parseInt(e.target.value) || 8)}
          />
        </div>
        <div className="form-group" style={{ flex: 1 }}>
          <label className="form-label">行数</label>
          <input
            type="number"
            className="form-input"
            min="1"
            max="20"
            value={rows}
            onChange={(e) => setRows(parseInt(e.target.value) || 11)}
          />
        </div>
      </div>

      {previewImage && (
        <div className="form-group">
          <label className="form-label">字帖预览</label>
          <div className="copybook-preview">
            {loading ? (
              <div className="loading-overlay" style={{ position: 'relative' }}>
                <div className="spinner"></div>
              </div>
            ) : (
              <img src={previewImage} alt="字帖预览" />
            )}
          </div>
        </div>
      )}

      <div className="btn-group">
        <button
          className="btn btn-primary"
          onClick={generatePreview}
          disabled={!characters || loading}
        >
          {loading ? '生成中...' : '预览字帖'}
        </button>
        <button
          className="btn btn-secondary"
          onClick={generatePdf}
          disabled={!characters || generatingPdf}
        >
          {generatingPdf ? '生成中...' : '下载PDF'}
        </button>
      </div>
    </div>
  );
}

export default CopybookGenerator;
