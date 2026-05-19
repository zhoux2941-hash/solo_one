import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  getFeeds: () => ipcRenderer.invoke('get-feeds'),
  addFeed: (url, category) => ipcRenderer.invoke('add-feed', url, category),
  deleteFeed: (id) => ipcRenderer.invoke('delete-feed', id),
  getArticles: (feedId, filter, category) => ipcRenderer.invoke('get-articles', feedId, filter, category),
  markRead: (articleId, read) => ipcRenderer.invoke('mark-read', articleId, read),
  markStarred: (articleId, starred) => ipcRenderer.invoke('mark-starred', articleId, starred),
  getArticle: (id) => ipcRenderer.invoke('get-article', id),
  refreshFeed: (feedId) => ipcRenderer.invoke('refresh-feed', feedId),
  refreshAll: () => ipcRenderer.invoke('refresh-all'),
  updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  getCategories: () => ipcRenderer.invoke('get-categories'),
  generateSummary: (content) => ipcRenderer.invoke('generate-summary', content),
  extractFullContent: (url, articleId) => ipcRenderer.invoke('extract-full-content', url, articleId),
  recordReading: (articleId, duration) => ipcRenderer.invoke('record-reading', articleId, duration),
  trainRecommendationModel: () => ipcRenderer.invoke('train-recommendation-model'),
  getRecommendations: (limit) => ipcRenderer.invoke('get-recommendations', limit),
  getSimilarArticles: (articleId, limit) => ipcRenderer.invoke('get-similar-articles', articleId, limit),
  getReadingHistory: () => ipcRenderer.invoke('get-reading-history')
})
