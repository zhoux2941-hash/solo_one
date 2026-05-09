import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

export const userApi = {
  createUser: (username, email) => 
    api.post('/users', { username, email }),
  
  getUser: (userId) => 
    api.get(`/users/${userId}`),
  
  getUserByUsername: (username) => 
    api.get(`/users/username/${username}`)
}

export const documentApi = {
  createDocument: (title, userId, initialContent = '') => 
    api.post('/documents', { title, userId, initialContent }),
  
  getDocument: (docId) => 
    api.get(`/documents/${docId}`),
  
  getUserDocuments: (userId) => 
    api.get(`/documents/user/${userId}`),
  
  updateContent: (docId, userId, content, isSave = false) => 
    api.put(`/documents/${docId}/content`, { userId, content, save: isSave }),
  
  logAction: (docId, userId, actionType, selectedText = null, positionStart = 0, positionEnd = 0) => 
    api.post(`/documents/${docId}/action`, { 
      userId, 
      actionType, 
      selectedText, 
      positionStart, 
      positionEnd 
    }),
  
  getVersions: (docId) => 
    api.get(`/documents/${docId}/versions`),
  
  getActions: (docId) => 
    api.get(`/documents/${docId}/actions`),
  
  getSentimentHistory: (docId) => 
    api.get(`/documents/${docId}/sentiment/history`),
  
  getParagraphSentiment: (docId) => 
    api.get(`/documents/${docId}/sentiment/paragraphs`),
  
  getWordCloud: (docId) => 
    api.get(`/documents/${docId}/sentiment/wordcloud`)
}

export default api
