class Scheduler {
  constructor(rssService, db) {
    this.rssService = rssService
    this.db = db
    this.intervalId = null
    this.intervalMinutes = 30
  }

  start() {
    const settings = this.db.getSettings()
    this.intervalMinutes = parseInt(settings.refreshInterval || 30)
    
    this.stop()
    this.scheduleNext()
  }

  stop() {
    if (this.intervalId) {
      clearTimeout(this.intervalId)
      this.intervalId = null
    }
  }

  updateInterval(minutes) {
    this.intervalMinutes = parseInt(minutes)
    this.start()
  }

  async scheduleNext() {
    try {
      await this.refreshAllFeeds()
    } catch (error) {
      console.error('Error in scheduled refresh:', error)
    }
    
    this.intervalId = setTimeout(
      () => this.scheduleNext(),
      this.intervalMinutes * 60 * 1000
    )
  }

  async refreshAllFeeds() {
    console.log('Starting scheduled refresh...')
    const feeds = await this.db.getFeeds()
    
    for (const feed of feeds) {
      try {
        await this.rssService.fetchAndSaveArticles(feed)
      } catch (error) {
        console.error(`Error refreshing feed ${feed.title}:`, error)
      }
    }
    
    console.log('Scheduled refresh completed')
  }
}

export default Scheduler
