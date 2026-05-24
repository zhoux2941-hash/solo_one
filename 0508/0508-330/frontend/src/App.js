import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import ReferenceList from './components/ReferenceList';
import UploadForm from './components/UploadForm';
import CitationPreview from './components/CitationPreview';
import ExportPanel from './components/ExportPanel';
import SearchBar from './components/SearchBar';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [selectedTab, setSelectedTab] = useState(0);
  const [selectedReferences, setSelectedReferences] = useState([]);
  const [selectedStyle, setSelectedStyle] = useState('acm');
  const [searchQuery, setSearchQuery] = useState('');

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static">
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                在线文献管理工具
              </Typography>
            </Toolbar>
          </AppBar>

          <Container maxWidth="xl" sx={{ mt: 3 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
              <Tabs value={selectedTab} onChange={handleTabChange}>
                <Tab label="文献列表" />
                <Tab label="上传文献" />
                <Tab label="引用预览" />
                <Tab label="导出" />
              </Tabs>
            </Box>

            {selectedTab === 0 && (
              <Box>
                <SearchBar 
                  searchQuery={searchQuery} 
                  onSearchChange={setSearchQuery} 
                />
                <ReferenceList 
                  searchQuery={searchQuery}
                  selectedReferences={selectedReferences}
                  onSelectionChange={setSelectedReferences}
                />
              </Box>
            )}

            {selectedTab === 1 && (
              <UploadForm />
            )}

            {selectedTab === 2 && (
              <CitationPreview 
                selectedReferences={selectedReferences}
                selectedStyle={selectedStyle}
                onStyleChange={setSelectedStyle}
              />
            )}

            {selectedTab === 3 && (
              <ExportPanel 
                selectedReferences={selectedReferences}
              />
            )}
          </Container>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;