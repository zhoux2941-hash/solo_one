import Parser from 'rss-parser'
import fetch from 'node-fetch'
import { JSDOM } from 'jsdom'
import { Readability } from '@mozilla/readability'
import * as cheerio from 'cheerio'
import { Buffer } from 'buffer'
import iconv from 'iconv-lite'

class RSSService {
  constructor(db) {
    this.db = db
    this.parser = new Parser()
  }

  async fetchFeed(url) {
    try {
      const feed = await this.parser.parseURL(url)
      return feed
    } catch (error) {
      console.error('Error fetching feed:', error)
      throw error
    }
  }

  async fetchAndSaveArticles(feed) {
    try {
      const parsedFeed = await this.parser.parseURL(feed.url)
      
      for (const item of parsedFeed.items) {
        const guid = item.guid || item.link
        const publishedAt = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString()
        
        let content = item.content || item.contentSnippet || item.summary || ''
        let summary = item.contentSnippet || item.summary || ''
        
        if (content.length < 500 && item.link) {
          try {
            const fullContent = await this.extractFullContent(item.link)
            if (fullContent && fullContent.length > content.length) {
              content = fullContent
            }
          } catch (e) {
            console.log('Failed to extract full content:', e)
          }
        }
        
        await this.db.addArticle(
          feed.id,
          guid,
          item.title,
          item.link,
          content,
          summary.substring(0, 500),
          publishedAt
        )
      }
      
      await this.db.updateFeedLastFetched(feed.id)
      return true
    } catch (error) {
      console.error('Error fetching articles:', error)
      return false
    }
  }

  getBrowserHeaders(url) {
    const domain = new URL(url).hostname
    return {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept-Encoding': 'gzip, deflate, br',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Referer': `https://${domain}/`,
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'same-origin',
      'Cache-Control': 'max-age=0'
    }
  }

  async decodeResponse(response) {
    const buffer = await response.arrayBuffer()
    const contentType = response.headers.get('content-type') || ''
    
    let charset = 'utf-8'
    const charsetMatch = contentType.match(/charset=([^;]+)/i)
    if (charsetMatch) {
      charset = charsetMatch[1].toLowerCase().replace(/['"]/g, '')
    }
    
    if (charset === 'utf-8' || charset === 'utf8') {
      return new TextDecoder('utf-8').decode(buffer)
    }
    
    try {
      return iconv.decode(Buffer.from(buffer), charset)
    } catch (e) {
      return new TextDecoder('utf-8').decode(buffer)
    }
  }

  async extractWithReadability(html, url) {
    try {
      const dom = new JSDOM(html, { 
        url,
        pretendToBeVisual: true,
        runScripts: 'dangerously'
      })
      
      const reader = new Readability(dom.window.document, {
        charThreshold: 100,
        keepClasses: false,
        nbTopCandidates: 5
      })
      
      const article = reader.parse()
      if (article && article.content && article.content.length > 200) {
        return article.content
      }
      return null
    } catch (error) {
      console.error('Readability extraction failed:', error)
      return null
    }
  }

  async extractWithCheerio(html, url) {
    try {
      const $ = cheerio.load(html, {
        decodeEntities: false,
        xmlMode: false
      })
      
      const domain = new URL(url).hostname
      
      const selectors = [
        'article',
        '[class*="article-content"]',
        '[class*="post-content"]',
        '[class*="entry-content"]',
        '[class*="main-content"]',
        '[class*="article-body"]',
        '[class*="post-body"]',
        '[id*="article-content"]',
        '[id*="post-content"]',
        '[id*="main-content"]',
        '.prose',
        '.content',
        'main',
        '#content',
        '.article',
        '.post'
      ]
      
      if (domain.includes('medium.com') || domain.includes('medium')) {
        return this.extractMedium($)
      }
      
      if (domain.includes('zhihu.com')) {
        return this.extractZhihu($)
      }
      
      if (domain.includes('jianshu.com')) {
        return this.extractJianshu($)
      }
      
      if (domain.includes('weixin.qq.com')) {
        return this.extractWeixin($)
      }
      
      for (const selector of selectors) {
        const elements = $(selector)
        if (elements.length > 0) {
          let maxContent = ''
          elements.each((i, el) => {
            const html = $(el).html()
            if (html && html.length > maxContent.length) {
              maxContent = html
            }
          })
          
          if (maxContent.length > 300) {
            return this.cleanContent(maxContent)
          }
        }
      }
      
      const bodyHtml = $('body').html()
      if (bodyHtml) {
        return this.cleanContent(bodyHtml)
      }
      
      return null
    } catch (error) {
      console.error('Cheerio extraction failed:', error)
      return null
    }
  }

  extractMedium($) {
    const article = $('article').html()
    if (article && article.length > 500) {
      return this.cleanContent(article)
    }
    
    const content = $('[data-testid="story"]').html() || 
                    $('.postArticle-content').html() ||
                    $('.meteredContent').html()
    
    if (content && content.length > 500) {
      return this.cleanContent(content)
    }
    
    return null
  }

  extractZhihu($) {
    const content = $('.RichContent-inner').html() || 
                    $('.Post-RichTextContainer').html() ||
                    $('.AnswerItem-richContent').html() ||
                    $('.QuestionAnswer-content').html()
    
    if (content && content.length > 500) {
      return this.cleanContent(content)
    }
    
    return null
  }

  extractJianshu($) {
    const content = $('article').html() || 
                    $('.show-content-free').html() ||
                    $('.article').html()
    
    if (content && content.length > 500) {
      return this.cleanContent(content)
    }
    
    return null
  }

  extractWeixin($) {
    const content = $('#js_content').html() || 
                    $('.rich_media_content').html()
    
    if (content && content.length > 500) {
      return this.cleanContent(content)
    }
    
    return null
  }

  cleanContent(html) {
    if (!html) return null
    
    const $ = cheerio.load(html, {
      decodeEntities: false,
      xmlMode: false
    })
    
    $('script, style, noscript, iframe').remove()
    
    $('[class*="ad"], [class*="advert"], [id*="ad"], [id*="advert"]').remove()
    $('[class*="comment"], [id*="comment"]').remove()
    $('[class*="nav"], [id*="nav"], [class*="menu"], [id*="menu"]').remove()
    $('[class*="sidebar"], [id*="sidebar"], [class*="widget"], [id*="widget"]').remove()
    $('[class*="footer"], [id*="footer"], [class*="header"], [id*="header"]').remove()
    $('[class*="related"], [id*="related"], [class*="recommend"], [id*="recommend"]').remove()
    
    $('a').each((i, el) => {
      const href = $(el).attr('href')
      if (href && !href.startsWith('http')) {
        $(el).removeAttr('href')
      }
    })
    
    const cleaned = $.html()
    return cleaned.length > 200 ? cleaned : null
  }

  async extractFullContent(url) {
    console.log('Extracting content from:', url)
    
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      
      const response = await fetch(url, {
        headers: this.getBrowserHeaders(url),
        redirect: 'follow',
        follow: 5,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const html = await this.decodeResponse(response)
      
      if (!html || html.length < 100) {
        throw new Error('Empty or too short HTML response')
      }
      
      let content = await this.extractWithReadability(html, url)
      
      if (!content || content.length < 300) {
        console.log('Readability failed or returned too little content, trying cheerio fallback')
        content = await this.extractWithCheerio(html, url)
      }
      
      if (content && content.length > 200) {
        console.log('Successfully extracted content:', content.length, 'characters')
        return content
      }
      
      console.log('All extraction methods failed or returned too little content')
      return null
      
    } catch (error) {
      console.error('Error extracting full content:', error.message)
      return null
    }
  }
}

export default RSSService
