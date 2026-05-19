import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'url'
import path from 'path'
import Database from './database.js'
import RSSService from './rss-service.js'
import Scheduler from './scheduler.js'
import AIService from './ai-service.js'
import RecommendationService from './recommendation-service.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow
let db
let rssService
let scheduler
let aiService
let recommendationService

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(async () => {
  db = new Database()
  await db.init()
  
  rssService = new RSSService(db)
  aiService = new AIService()
  scheduler = new Scheduler(rssService, db)
  recommendationService = new RecommendationService(db)
  
  scheduler.start()
  
  setTimeout(async () => {
    try {
      await recommendationService.trainModel()
    } catch (e) {
      console.error('Initial model training failed:', e)
    }
  }, 5000)
  
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
  scheduler.stop()
  db.close()
})

ipcMain.handle('get-feeds', async () => {
  return db.getFeeds()
})

ipcMain.handle('add-feed', async (event, url, category) => {
  const feed = await rssService.fetchFeed(url)
  return db.addFeed(url, feed.title, category || '未分类', feed.description || '')
})

ipcMain.handle('delete-feed', async (event, id) => {
  return db.deleteFeed(id)
})

ipcMain.handle('get-articles', async (event, feedId, filter, category) => {
  return db.getArticles(feedId, filter, category)
})

ipcMain.handle('mark-read', async (event, articleId, read) => {
  return db.markAsRead(articleId, read)
})

ipcMain.handle('mark-starred', async (event, articleId, starred) => {
  return db.markAsStarred(articleId, starred)
})

ipcMain.handle('get-article', async (event, id) => {
  return db.getArticle(id)
})

ipcMain.handle('refresh-feed', async (event, feedId) => {
  const feed = await db.getFeed(feedId)
  if (feed) {
    await rssService.fetchAndSaveArticles(feed)
  }
  return true
})

ipcMain.handle('refresh-all', async () => {
  const feeds = await db.getFeeds()
  for (const feed of feeds) {
    await rssService.fetchAndSaveArticles(feed)
  }
  return true
})

ipcMain.handle('update-settings', async (event, settings) => {
  scheduler.updateInterval(settings.refreshInterval)
  return db.updateSettings(settings)
})

ipcMain.handle('get-settings', async () => {
  return db.getSettings()
})

ipcMain.handle('get-categories', async () => {
  return db.getCategories()
})

ipcMain.handle('generate-summary', async (event, content) => {
  return aiService.generateSummary(content)
})

ipcMain.handle('extract-full-content', async (event, url, articleId = null) => {
  const content = await rssService.extractFullContent(url)
  if (content && articleId) {
    try {
      db.updateArticleContent(articleId, content)
    } catch (e) {
      console.error('Failed to save article content:', e)
    }
  }
  return content
})

ipcMain.handle('record-reading', async (event, articleId, duration = 0) => {
  return db.recordReading(articleId, duration)
})

ipcMain.handle('train-recommendation-model', async () => {
  return recommendationService.trainModel()
})

ipcMain.handle('get-recommendations', async (event, limit = 20) => {
  return recommendationService.getRecommendations(limit)
})

ipcMain.handle('get-similar-articles', async (event, articleId, limit = 10) => {
  return recommendationService.getSimilarArticles(articleId, limit)
})

ipcMain.handle('get-reading-history', async () => {
  return db.getReadingHistory()
})
