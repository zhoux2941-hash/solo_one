import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Paper,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Tooltip
} from '@mui/material';

function CitationPreview({ selectedReferences, selectedStyle, onStyleChange }) {
  const [styles, setStyles] = useState([]);
  const [loadedStyles, setLoadedStyles] = useState([]);
  const [citations, setCitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [styleSwitching, setStyleSwitching] = useState(false);
  const [error, setError] = useState(null);
  const [wasPreloaded, setWasPreloaded] = useState(false);

  useEffect(() => {
    const fetchStyles = async () => {
      try {
        const response = await axios.get('/api/styles');
        setStyles(response.data.styles || response.data);
        setLoadedStyles(response.data.loadedStyles || []);
      } catch (err) {
        console.error('Error fetching styles:', err);
      }
    };
    fetchStyles();
  }, []);

  useEffect(() => {
    if (selectedReferences.length > 0) {
      formatCitations();
    } else {
      setCitations([]);
    }
  }, [selectedReferences, selectedStyle]);

  const handleStyleChange = async (newStyle) => {
    setStyleSwitching(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/styles/switch', { style: newStyle });
      setWasPreloaded(response.data.wasPreloaded);
      onStyleChange(newStyle);
    } catch (err) {
      console.error('Style switch error:', err);
      onStyleChange(newStyle);
    } finally {
      setStyleSwitching(false);
    }
  };

  const formatCitations = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('/api/styles/format', {
        referenceIds: selectedReferences,
        style: selectedStyle
      });
      setCitations(response.data.citations);
      setWasPreloaded(response.data.wasStylePreloaded);
    } catch (err) {
      setError(err.response?.data?.error || '格式化失败');
    }
    setLoading(false);
  };

  const isStylePreloaded = (styleId) => loadedStyles.includes(styleId);

  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">
          引用格式预览
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {styles.map(style => (
            <Tooltip 
              key={style.id} 
              title={isStylePreloaded(style.id) ? '已预加载' : '点击加载'}
            >
              <Chip 
                label={style.name}
                size="small"
                color={isStylePreloaded(style.id) ? 'success' : 'default'}
                variant={selectedStyle === style.id ? 'filled' : 'outlined'}
              />
            </Tooltip>
          ))}
        </Box>
      </Box>

      <Box sx={{ mb: 3 }}>
        <FormControl fullWidth>
          <InputLabel>选择期刊格式</InputLabel>
          <Select
            value={selectedStyle}
            label="选择期刊格式"
            onChange={(e) => handleStyleChange(e.target.value)}
            disabled={styleSwitching}
          >
            {styles.map((style) => (
              <MenuItem key={style.id} value={style.id}>
                {style.name}
                {isStylePreloaded(style.id) && (
                  <Chip 
                    label="已预加载" 
                    size="small" 
                    color="success" 
                    variant="outlined"
                    sx={{ ml: 1 }}
                  />
                )}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {styleSwitching && (
          <Typography variant="caption" color="primary" sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
            <CircularProgress size={12} sx={{ mr: 1 }} />
            正在切换样式...
          </Typography>
        )}
        {wasPreloaded && !styleSwitching && (
          <Typography variant="caption" color="success.main" sx={{ mt: 1 }}>
            ✓ 样式已预加载，响应迅速
          </Typography>
        )}
      </Box>

      {selectedReferences.length === 0 && (
        <Alert severity="info">
          请在文献列表中选择文献以查看引用格式预览
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading || styleSwitching ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        citations.length > 0 && (
          <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#fafafa' }}>
            <Typography variant="subtitle2" gutterBottom color="text.secondary">
              已选择 {selectedReferences.length} 条文献 - {styles.find(s => s.id === selectedStyle)?.name} 格式
            </Typography>
            <List>
              {citations.map((citation, index) => (
                <React.Fragment key={index}>
                  <ListItem alignItems="flex-start">
                    <ListItemText
                      primary={
                        <Typography variant="body1" component="span">
                          [{index + 1}] {citation}
                        </Typography>
                      }
                    />
                  </ListItem>
                  {index < citations.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        )
      )}
    </Paper>
  );
}

export default CitationPreview;