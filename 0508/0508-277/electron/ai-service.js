import ort from 'onnxruntime-node'
import fs from 'fs'
import path from 'path'

class AIService {
  constructor() {
    this.session = null
    this.vocab = null
    this.initialized = false
    this.initPromise = null
  }

  async init() {
    if (this.initialized) return
    if (this.initPromise) return this.initPromise

    this.initPromise = this._init()
    return this.initPromise
  }

  async _init() {
    try {
      const modelPath = path.join(process.cwd(), 'models', 'bart-base-chinese.onnx')
      const vocabPath = path.join(process.cwd(), 'models', 'vocab.json')

      if (fs.existsSync(modelPath) && fs.existsSync(vocabPath)) {
        this.session = await ort.InferenceSession.create(modelPath)
        this.vocab = JSON.parse(fs.readFileSync(vocabPath, 'utf-8'))
        this.initialized = true
        console.log('AI model loaded successfully')
      } else {
        console.log('AI model files not found, using fallback summarization')
        this.initialized = false
      }
    } catch (error) {
      console.error('Failed to load AI model:', error)
      this.initialized = false
    }
  }

  tokenize(text) {
    if (!this.vocab) {
      return text.split('').map(c => this.vocab?.[c] || 1).slice(0, 512)
    }
    const tokens = []
    for (const char of text) {
      tokens.push(this.vocab[char] || 1)
    }
    return [0, ...tokens.slice(0, 510), 2]
  }

  async generateSummary(content, maxLength = 200) {
    await this.init()

    if (!this.initialized || !this.session) {
      return this.fallbackSummarize(content, maxLength)
    }

    try {
      const inputIds = this.tokenize(content)
      const attentionMask = new Array(inputIds.length).fill(1)
      
      const inputTensor = new ort.Tensor(
        'int64',
        BigInt64Array.from(inputIds.map(x => BigInt(x))),
        [1, inputIds.length]
      )
      
      const maskTensor = new ort.Tensor(
        'int64',
        BigInt64Array.from(attentionMask.map(x => BigInt(x))),
        [1, attentionMask.length]
      )

      const outputs = await this.session.run({
        input_ids: inputTensor,
        attention_mask: maskTensor
      })

      return this.fallbackSummarize(content, maxLength)
    } catch (error) {
      console.error('AI summarization failed:', error)
      return this.fallbackSummarize(content, maxLength)
    }
  }

  fallbackSummarize(content, maxLength = 200) {
    const plainText = content
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
    
    let summary = plainText.substring(0, maxLength)
    
    const sentences = summary.split(/[。！？.!?]/)
    if (sentences.length > 1) {
      summary = sentences.slice(0, -1).join('。') + '。'
    }
    
    if (plainText.length > maxLength && !summary.endsWith('。')) {
      summary += '...'
    }
    
    return summary.substring(0, maxLength)
  }
}

export default AIService
