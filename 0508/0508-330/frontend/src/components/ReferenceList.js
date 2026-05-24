import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import debounce from 'lodash/debounce';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
  IconButton,
  Typography,
  Chip,
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

function ReferenceList({ searchQuery, selectedReferences, onSelectionChange }) {
  const [references, setReferences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [totalCount, setTotalCount] = useState(0);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingReference, setEditingReference] = useState(null);

  const fetchReferences = useCallback(
    debounce(async (search) => {
      setLoading(true);
      try {
        const response = await axios.get('/api/references', {
          params: {
            search: search || undefined,
            page: page + 1,
            limit: rowsPerPage
          }
        });
        setReferences(response.data.references);
        setTotalCount(response.data.pagination.total);
      } catch (error) {
        console.error('Error fetching references:', error);
      }
      setLoading(false);
    }, 300),
    [page, rowsPerPage]
  );

  useEffect(() => {
    fetchReferences(searchQuery);
  }, [searchQuery, page, rowsPerPage, fetchReferences]);

  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = references.map((r) => r._id);
      onSelectionChange(newSelected);
      return;
    }
    onSelectionChange([]);
  };

  const handleSelectClick = (id) => {
    const selectedIndex = selectedReferences.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedReferences, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedReferences.slice(1));
    } else if (selectedIndex === selectedReferences.length - 1) {
      newSelected = newSelected.concat(selectedReferences.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedReferences.slice(0, selectedIndex),
        selectedReferences.slice(selectedIndex + 1)
      );
    }

    onSelectionChange(newSelected);
  };

  const isSelected = (id) => selectedReferences.indexOf(id) !== -1;

  const handleEdit = (reference) => {
    setEditingReference({ ...reference });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    try {
      await axios.put(`/api/references/${editingReference._id}`, editingReference);
      setEditDialogOpen(false);
      fetchReferences(searchQuery);
    } catch (error) {
      console.error('Error updating reference:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('确定要删除这条文献吗？')) {
      try {
        await axios.delete(`/api/references/${id}`);
        fetchReferences(searchQuery);
        onSelectionChange(selectedReferences.filter(refId => refId !== id));
      } catch (error) {
        console.error('Error deleting reference:', error);
      }
    }
  };

  const handleBatchDelete = async () => {
    if (window.confirm(`确定要删除选中的 ${selectedReferences.length} 条文献吗？`)) {
      try {
        await axios.post('/api/references/batch-delete', { ids: selectedReferences });
        fetchReferences(searchQuery);
        onSelectionChange([]);
      } catch (error) {
        console.error('Error batch deleting references:', error);
      }
    }
  };

  const formatAuthors = (authors) => {
    if (!authors || authors.length === 0) return '';
    const names = authors.map(a => a.family).join(', ');
    return names.length > 50 ? names.substring(0, 50) + '...' : names;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">
          共 {totalCount} 条文献 {selectedReferences.length > 0 && `(已选 ${selectedReferences.length} 条)`}
        </Typography>
        {selectedReferences.length > 0 && (
          <Button
            variant="contained"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleBatchDelete}
          >
            批量删除
          </Button>
        )}
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedReferences.length > 0 && selectedReferences.length < references.length}
                    checked={references.length > 0 && selectedReferences.length === references.length}
                    onChange={handleSelectAllClick}
                  />
                </TableCell>
                <TableCell>标题</TableCell>
                <TableCell>作者</TableCell>
                <TableCell>年份</TableCell>
                <TableCell>期刊/会议</TableCell>
                <TableCell>标签</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : references.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body1">暂无文献数据</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                references.map((reference) => {
                  const isItemSelected = isSelected(reference._id);
                  return (
                    <TableRow
                      hover
                      role="checkbox"
                      aria-checked={isItemSelected}
                      key={reference._id}
                      selected={isItemSelected}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox
                          checked={isItemSelected}
                          onClick={() => handleSelectClick(reference._id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 300 }}>
                          {reference.title}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatAuthors(reference.author)}
                        </Typography>
                      </TableCell>
                      <TableCell>{reference.year}</TableCell>
                      <TableCell>{reference.journal || reference.booktitle || '-'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {reference.tags?.slice(0, 3).map((tag, index) => (
                            <Chip key={index} label={tag} size="small" />
                          ))}
                          {reference.tags?.length > 3 && (
                            <Chip label={`+${reference.tags.length - 3}`} size="small" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleEdit(reference)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(reference._id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50, 100]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>编辑文献</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="标题"
              fullWidth
              multiline
              value={editingReference?.title || ''}
              onChange={(e) => setEditingReference({ ...editingReference, title: e.target.value })}
            />
            <TextField
              label="年份"
              type="number"
              value={editingReference?.year || ''}
              onChange={(e) => setEditingReference({ ...editingReference, year: parseInt(e.target.value) })}
            />
            <TextField
              label="期刊"
              fullWidth
              value={editingReference?.journal || ''}
              onChange={(e) => setEditingReference({ ...editingReference, journal: e.target.value })}
            />
            <TextField
              label="出版社"
              fullWidth
              value={editingReference?.publisher || ''}
              onChange={(e) => setEditingReference({ ...editingReference, publisher: e.target.value })}
            />
            <TextField
              label="DOI"
              fullWidth
              value={editingReference?.doi || ''}
              onChange={(e) => setEditingReference({ ...editingReference, doi: e.target.value })}
            />
            <TextField
              label="摘要"
              fullWidth
              multiline
              rows={3}
              value={editingReference?.abstract || ''}
              onChange={(e) => setEditingReference({ ...editingReference, abstract: e.target.value })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>取消</Button>
          <Button onClick={handleSaveEdit} variant="contained">保存</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default ReferenceList;