import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Paper,
  Box,
  TextField,
  Chip,
  Typography,
  Autocomplete,
  CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

function SearchBar({ searchQuery, onSearchChange }) {
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await axios.get('/api/references/tags/all');
        setAllTags(response.data.map(t => t.name));
      } catch (err) {
        console.error('Error fetching tags:', err);
      }
    };
    fetchTags();
  }, []);

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <SearchIcon color="action" />
        <TextField
          fullWidth
          variant="outlined"
          placeholder="搜索文献标题、作者、摘要..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <Autocomplete
          multiple
          options={allTags}
          value={selectedTags}
          onChange={(e, newValue) => setSelectedTags(newValue)}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip variant="outlined" label={option} {...getTagProps({ index })} />
            ))
          }
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              label="标签筛选"
              placeholder="选择标签"
              sx={{ minWidth: 200 }}
            />
          )}
          sx={{ minWidth: 200 }}
        />
      </Box>
    </Paper>
  );
}

export default SearchBar;