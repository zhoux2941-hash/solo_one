const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('snippetAPI', {
  getAllSnippets: () => ipcRenderer.invoke('snippets:getAll'),
  getSnippetById: (id) => ipcRenderer.invoke('snippets:getById', id),
  createSnippet: (data) => ipcRenderer.invoke('snippets:create', data),
  updateSnippet: (data) => ipcRenderer.invoke('snippets:update', data),
  deleteSnippet: (id) => ipcRenderer.invoke('snippets:delete', id),
  searchSnippets: (query) => ipcRenderer.invoke('snippets:search', query),
  getAllTags: () => ipcRenderer.invoke('tags:getAll'),
  getSnippetsByTag: (tagName) => ipcRenderer.invoke('snippets:getByTag', tagName),
  copyToClipboard: (text) => ipcRenderer.invoke('clipboard:copy', text),
  runCode: (language, code) => ipcRenderer.invoke('code:run', { language, code })
});
