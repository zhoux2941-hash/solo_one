import React, { useState } from 'react';
import axios from 'axios';
import {
  Paper,
  Box,
  Typography,
  Button,
  ButtonGroup,
  Alert,
  CircularProgress
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import DescriptionIcon from '@mui/icons-material/Description';
import CodeIcon from '@mui/icons-material/Code';

function ExportPanel({ selectedReferences }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleExport = async (format) => {
    if (selectedReferences.length === 0) {
      setError('请先选择要导出的文献');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`/api/export/${format}`, 
        { referenceIds: selectedReferences },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      
      const extensions = {
        ris: 'ris',
        endnote: 'xml',
        bibtex: 'bib'
      };
      
      link.setAttribute('download', `references.${extensions[format]}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('导出失败，请重试');
    }
    setLoading(false);
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        导出文献
      </Typography>

      {selectedReferences.length === 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          请在文献列表中选择要导出的文献
        </Alert>
      )}

      {selectedReferences.length > 0 && (
        <Alert severity="success" sx={{ mb: 3 }}>
          已选择 {selectedReferences.length} 条文献准备导出
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Button
          variant="contained"
          size="large"
          startIcon={loading ? <CircularProgress size={20} /> : <DownloadIcon />}
          onClick={() => handleExport('ris')}
          disabled={loading || selectedReferences.length === 0}
          sx={{ justifyContent: 'flex-start', py: 2 }}
        >
          <Box sx={{ textAlign: 'left', ml: 1 }}>
            <Typography variant="subtitle1">导出 RIS 格式</Typography>
            <Typography variant="body2" color="text.secondary">
              适用于大多数文献管理软件（EndNote, Zotero, Mendeley等）
            </Typography>
          </Box>
        </Button>

        <Button
          variant="contained"
          size="large"
          startIcon={loading ? <CircularProgress size={20} /> : <DescriptionIcon />}
          onClick={() => handleExport('endnote')}
          disabled={loading || selectedReferences.length === 0}
          sx={{ justifyContent: 'flex-start', py: 2 }}
        >
          <Box sx={{ textAlign: 'left', ml: 1 }}>
            <Typography variant="subtitle1">导出 EndNote XML 格式</Typography>
            <Typography variant="body2" color="text.secondary">
              专门适用于 EndNote 文献管理软件
            </Typography>
          </Box>
        </Button>

        <Button
          variant="contained"
          size="large"
          startIcon={loading ? <CircularProgress size={20} /> : <CodeIcon />}
          onClick={() => handleExport('bibtex')}
          disabled={loading || selectedReferences.length === 0}
          sx={{ justifyContent: 'flex-start', py: 2 }}
        >
          <Box sx={{ textAlign: 'left', ml: 1 }}>
            <Typography variant="subtitle1">导出 BibTeX 格式</Typography>
            <Typography variant="body2" color="text.secondary">
              适用于 LaTeX 排版系统
            </Typography>
          </Box>
        </Button>
      </Box>
    </Paper>
  );
}

export default ExportPanel;