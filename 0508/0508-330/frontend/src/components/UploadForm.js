import React, { useState } from 'react';
import axios from 'axios';
import {
  Paper,
  Box,
  Typography,
  Button,
  TextField,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  MenuItem
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import EditNoteIcon from '@mui/icons-material/EditNote';

function UploadForm() {
  const [activeTab, setActiveTab] = useState(0);
  const [file, setFile] = useState(null);
  const [bibtexContent, setBibtexContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [manualEntry, setManualEntry] = useState({
    type: 'article',
    title: '',
    author: '',
    journal: '',
    booktitle: '',
    publisher: '',
    year: '',
    volume: '',
    number: '',
    pages: '',
    doi: '',
    abstract: '',
    keywords: ''
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setResult(null);
    setError(null);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('请选择一个文件');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('/api/references/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setResult(response.data);
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.error || '上传失败');
    }
    setLoading(false);
  };

  const handleBibtexSubmit = async (e) => {
    e.preventDefault();
    if (!bibtexContent.trim()) {
      setError('请输入BibTeX内容');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await axios.post('/api/references/upload', {
        content: bibtexContent
      });
      setResult(response.data);
      setBibtexContent('');
    } catch (err) {
      setError(err.response?.data?.error || '解析失败');
    }
    setLoading(false);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualEntry.title.trim()) {
      setError('请输入标题');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const referenceData = {
        ...manualEntry,
        year: manualEntry.year ? parseInt(manualEntry.year) : null,
        author: manualEntry.author 
          ? manualEntry.author.split(';').map(name => {
              const trimmed = name.trim();
              if (trimmed.includes(',')) {
                const [family, given] = trimmed.split(',').map(s => s.trim());
                return { family, given };
              }
              return { family: trimmed, given: '' };
            }).filter(a => a.family)
          : [],
        keywords: manualEntry.keywords 
          ? manualEntry.keywords.split(/[,;]/).map(k => k.trim()).filter(k => k) 
          : [],
        citationKey: `manual_${Date.now()}`
      };

      const response = await axios.post('/api/references', referenceData);
      setResult({ success: true, count: 1, references: [response.data] });
      setManualEntry({
        type: 'article',
        title: '',
        author: '',
        journal: '',
        booktitle: '',
        publisher: '',
        year: '',
        volume: '',
        number: '',
        pages: '',
        doi: '',
        abstract: '',
        keywords: ''
      });
    } catch (err) {
      setError(err.response?.data?.error || '保存失败');
    }
    setLoading(false);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        上传文献
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab icon={<UploadFileIcon />} label="文件上传" />
          <Tab icon={<EditNoteIcon />} label="BibTeX文本" />
          <Tab label="手动录入" />
        </Tabs>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Alert severity="success" sx={{ mb: 2 }}>
          成功导入 {result.count} 条文献！
        </Alert>
      )}

      {activeTab === 0 && (
        <Box component="form" onSubmit={handleFileUpload}>
          <Box
            sx={{
              border: '2px dashed #ccc',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              mb: 2,
              '&:hover': { borderColor: 'primary.main' }
            }}
          >
            <input
              type="file"
              accept=".bib,.txt"
              onChange={(e) => setFile(e.target.files[0])}
              style={{ display: 'none' }}
              id="file-upload"
            />
            <label htmlFor="file-upload">
              <Button variant="contained" component="span" disabled={loading}>
                选择文件
              </Button>
            </label>
            {file && (
              <Typography variant="body1" sx={{ mt: 2 }}>
                已选择: {file.name}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              支持 .bib 或 .txt 格式的BibTeX文件
            </Typography>
          </Box>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading || !file}
          >
            {loading ? <CircularProgress size={24} /> : '上传并解析'}
          </Button>
        </Box>
      )}

      {activeTab === 1 && (
        <Box component="form" onSubmit={handleBibtexSubmit}>
          <TextField
            fullWidth
            multiline
            rows={12}
            label="BibTeX内容"
            value={bibtexContent}
            onChange={(e) => setBibtexContent(e.target.value)}
            placeholder={`@article{key2024,\n  title={论文标题},\n  author={作者1 and 作者2},\n  journal={期刊名称},\n  year={2024}\n}`}
            sx={{ mb: 2 }}
          />
          <Button
            type="submit"
            variant="contained"
            fullWidth
            disabled={loading || !bibtexContent.trim()}
          >
            {loading ? <CircularProgress size={24} /> : '解析并保存'}
          </Button>
        </Box>
      )}

      {activeTab === 2 && (
        <Box component="form" onSubmit={handleManualSubmit}>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField
              select
              label="文献类型"
              value={manualEntry.type}
              onChange={(e) => setManualEntry({ ...manualEntry, type: e.target.value })}
            >
              <MenuItem value="article">期刊论文</MenuItem>
              <MenuItem value="book">书籍</MenuItem>
              <MenuItem value="incollection">书籍章节</MenuItem>
              <MenuItem value="inproceedings">会议论文</MenuItem>
              <MenuItem value="phdthesis">博士论文</MenuItem>
              <MenuItem value="mastersthesis">硕士论文</MenuItem>
              <MenuItem value="techreport">技术报告</MenuItem>
              <MenuItem value="misc">其他</MenuItem>
            </TextField>
            <TextField
              label="年份"
              type="number"
              value={manualEntry.year}
              onChange={(e) => setManualEntry({ ...manualEntry, year: e.target.value })}
            />
            <TextField
              label="标题"
              fullWidth
              value={manualEntry.title}
              onChange={(e) => setManualEntry({ ...manualEntry, title: e.target.value })}
              sx={{ gridColumn: '1 / -1' }}
            />
            <TextField
              label="作者（用分号分隔）"
              fullWidth
              value={manualEntry.author}
              onChange={(e) => setManualEntry({ ...manualEntry, author: e.target.value })}
              placeholder="张三, 四; 王五, 六"
              sx={{ gridColumn: '1 / -1' }}
            />
            <TextField
              label="期刊"
              value={manualEntry.journal}
              onChange={(e) => setManualEntry({ ...manualEntry, journal: e.target.value })}
            />
            <TextField
              label="会议/书籍名称"
              value={manualEntry.booktitle}
              onChange={(e) => setManualEntry({ ...manualEntry, booktitle: e.target.value })}
            />
            <TextField
              label="出版社"
              value={manualEntry.publisher}
              onChange={(e) => setManualEntry({ ...manualEntry, publisher: e.target.value })}
            />
            <TextField
              label="卷号"
              value={manualEntry.volume}
              onChange={(e) => setManualEntry({ ...manualEntry, volume: e.target.value })}
            />
            <TextField
              label="期号"
              value={manualEntry.number}
              onChange={(e) => setManualEntry({ ...manualEntry, number: e.target.value })}
            />
            <TextField
              label="页码"
              value={manualEntry.pages}
              onChange={(e) => setManualEntry({ ...manualEntry, pages: e.target.value })}
            />
            <TextField
              label="DOI"
              value={manualEntry.doi}
              onChange={(e) => setManualEntry({ ...manualEntry, doi: e.target.value })}
            />
            <TextField
              label="关键词（用逗号/分号分隔）"
              fullWidth
              value={manualEntry.keywords}
              onChange={(e) => setManualEntry({ ...manualEntry, keywords: e.target.value })}
              sx={{ gridColumn: '1 / -1' }}
            />
            <TextField
              label="摘要"
              fullWidth
              multiline
              rows={3}
              value={manualEntry.abstract}
              onChange={(e) => setManualEntry({ ...manualEntry, abstract: e.target.value })}
              sx={{ gridColumn: '1 / -1' }}
            />
          </Box>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            disabled={loading || !manualEntry.title.trim()}
          >
            {loading ? <CircularProgress size={24} /> : '保存文献'}
          </Button>
        </Box>
      )}
    </Paper>
  );
}

export default UploadForm;