import * as cheerio from 'cheerio'

class TextProcessor {
  constructor() {
    this.stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
      'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought',
      'used', 'it', 'its', 'this', 'that', 'these', 'those', 'i', 'you', 'he',
      'she', 'we', 'they', 'what', 'which', 'who', 'whom', 'whose', 'where',
      'when', 'why', 'how', 'all', 'each', 'every', 'both', 'few', 'more',
      'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
      'same', 'so', 'than', 'too', 'very', 'just', 'also', 'now', 'here',
      'there', 'then', 'once', 'if', 'because', 'while', 'although', 'though',
      'after', 'before', 'since', 'until', 'unless', 'however', 'therefore',
      'thus', 'hence', 'moreover', 'furthermore', 'nevertheless', 'nonetheless',
      '的', '是', '在', '了', '和', '与', '或', '但', '而', '也', '都', '就',
      '被', '把', '让', '给', '到', '从', '向', '对', '于', '这', '那', '有',
      '没', '不', '很', '太', '最', '更', '还', '又', '再', '已', '曾', '正',
      '刚', '才', '将', '要', '会', '能', '可以', '应该', '必须', '可能', '也许',
      '大概', '大约', '几乎', '差不多', '甚至', '尤其', '特别', '非常', '极其',
      '他', '她', '它', '他们', '她们', '它们', '我们', '你们', '我', '你', '您',
      '谁', '什么', '哪里', '何时', '为什么', '怎么', '如何', '哪些', '哪个',
      '这里', '那里', '哪里', '今天', '明天', '昨天', '现在', '然后', '以后',
      '以前', '之前', '之后', '因为', '所以', '但是', '然而', '不过', '其实',
      '实际上', '事实上', '总之', '总而言之', '综上所述', '由此可见',
      '因此', '因而', '于是', '结果', '那么', '这个', '那个', '这些', '那些',
      '一个', '一次', '一种', '一下', '一起', '一样', '一般', '一定', '一直',
      '一点', '一些', '许多', '很多', '大量', '部分', '全部', '整个', '各个',
      '每个', '个别', '其他', '其它', '另外', '此外', '以及', '包括', '包含',
      '还有', '例如', '比如', '诸如', '等等', '所谓', '认为', '觉得', '以为',
      '希望', '期望', '渴望', '想要', '需要', '需求', '要求', '请求', '申请',
      '建议', '意见', '想法', '观点', '看法', '态度', '立场', '角度', '方面',
      '问题', '情况', '状况', '状态', '情形', '事例', '例子', '样本', '样品',
      '方式', '方法', '办法', '措施', '步骤', '程序', '流程', '过程', '进程',
      '结果', '效果', '成果', '成就', '成绩', '业绩', '绩效', '效率', '效益',
      '优点', '缺点', '优势', '劣势', '长处', '短处', '好处', '坏处', '利益',
      '价值', '价格', '成本', '费用', '花费', '支出', '收入', '收益', '利润',
      '投资', '回报', '风险', '危险', '安全', '保险', '保障', '保护', '维护',
      '支持', '帮助', '协助', '援助', '救援', '救助', '拯救', '保存', '保留',
      '保持', '维持', '持续', '继续', '连续', '不断', '不停', '一直', '始终',
      '永远', '永久', '永恒', '暂时', '临时', '短暂', '瞬间', '刹那', '片刻',
      '最近', '近来', '近期', '目前', '当前', '现在', '如今', '当今', '今日',
      '今天', '昨天', '前天', '明天', '后天', '上周', '本周', '下周', '上月',
      '本月', '下月', '去年', '今年', '明年', '往年', '来年', '未来', '将来',
      '过去', '现在', '将来', '时间', '时刻', '时期', '期间', '时候', '时光',
      '光阴', '岁月', '日子', '日期', '年代', '世纪', '千年', '百年', '十年',
      '一年', '一月', '一周', '一天', '一小时', '一分钟', '一秒钟', '第一',
      '第二', '第三', '第四', '第五', '第六', '第七', '第八', '第九', '第十',
      '首先', '其次', '再次', '最后', '最终', '终于', '到底', '究竟', '毕竟',
      '居然', '竟然', '果然', '果真', '真的', '确实', '的确', '实在', '其实',
      '事实上', '实际上', '实质上', '本质上', '基本上', '根本上', '大体上',
      '大致', '大概', '大约', '约摸', '差不多', '几乎', '险些', '简直', '几乎不',
      '不', '没', '无', '非', '否', '别', '勿', '未', '莫', '休', '不要', '不用',
      '不必', '无须', '无需', '不用', '不必', '无须', '无需', '不能', '不可',
      '不许', '不准', '禁止', '严禁', '防止', '以防', '以免', '免得', '省得',
      '为了', '以便', '以求', '借以', '用以', '用来', '用于', '作为', '当作',
      '算作', '看作', '视为', '称作', '叫做', '称为', '名为', '号称', '自称',
      '宣称', '声称', '声明', '表明', '表示', '表达', '显示', '展示', '展现',
      '呈现', '出现', '显现', '显露', '暴露', '揭露', '揭示', '展示', '显示',
      '表示', '表明', '表达', '说明', '阐明', '解释', '解答', '解决', '处理',
      '办理', '料理', '安排', '布置', '部署', '计划', '规划', '打算', '盘算',
      '考虑', '思考', '思索', '思量', '琢磨', '斟酌', '权衡', '衡量', '评估',
      '评价', '评判', '鉴定', '判断', '断定', '确定', '确认', '证实', '证明',
      '验证', '检验', '检查', '审查', '审核', '审计', '核对', '核实', '查对',
      '查', '找', '寻', '找', '搜索', '搜寻', '查找', '寻找', '寻觅', '追求',
      '寻求', '争取', '力求', '力图', '力求', '努力', '尽力', '竭力', '全力',
      '奋力', '拼命', '努力', '奋斗', '斗争', '拼搏', '冲刺', '前进', '进步',
      '发展', '进展', '前进', '迈进', '走向', '朝着', '向着', '往', '朝', '向',
      '到', '去', '来', '回', '走', '跑', '跳', '飞', '爬', '游泳', '骑车',
      '开车', '坐车', '乘船', '坐飞机', '乘坐', '搭乘', '换乘', '转车', '转乘',
      '上下', '左右', '前后', '内外', '中间', '中央', '中心', '核心', '重心',
      '中心', '重点', '要点', '焦点', '核心', '关键', '要害', '命脉', '根本',
      '基础', '根基', '基石', '底蕴', '内涵', '外延', '内容', '形式', '方式',
      '手段', '工具', '器具', '器械', '设备', '装备', '器材', '物品', '物件',
      '东西', '对象', '目标', '目的', '意图', '意向', '动机', '目的', '目标',
      '任务', '使命', '责任', '义务', '职责', '职务', '职位', '岗位', '工作',
      '职业', '事业', '行业', '领域', '范围', '范畴', '领域', '方面', '维度',
      '层次', '层面', '等级', '级别', '档次', '层次', '水平', '水准', '程度',
      '幅度', '范围', '规模', '大小', '数量', '多少', '许多', '很多', '大量',
      '少量', '少许', '一点', '一些', '部分', '全部', '全体', '整体', '总体',
      '整个', '所有', '一切', '全部', '总共', '总计', '合计', '共计', '总和',
      '总数', '总额', '总量', '平均数', '平均值', '中位数', '众数', '比例',
      '比率', '百分比', '百分点', '千分比', '万分比', '分数', '小数', '整数',
      '正数', '负数', '零', '个', '十', '百', '千', '万', '亿', '兆', '之一',
      '之一', '其二', '其三', '其四', '其五', '首先', '其次', '再次', '最后',
      '第一', '第二', '第三', '第四', '第五', '第六', '第七', '第八', '第九',
      '第十', '最后', '终于', '最终', '结果', '结尾', '结束', '完成', '完毕',
      '终结', '终了', '完结', '了结', '搞定', '搞定了', '完成了', '结束了',
      '好了', '行了', '可以了', '够了', '足够了', '充分', '充足', '充沛', '充裕',
      '丰富', '丰厚', '丰盛', '丰硕', '丰裕', '富饶', '富足', '富裕', '富有',
      '贫穷', '贫困', '穷困', '困苦', '艰难', '艰苦', '辛苦', '辛劳', '劳苦',
      '劳累', '疲劳', '疲惫', '疲乏', '乏力', '无力', '虚弱', '衰弱', '衰退',
      '衰落', '衰败', '败落', '没落', '消亡', '灭亡', '消失', '消逝', '消散',
      '散去', '消除', '清除', '消除', '根除', '铲除', '消灭', '歼灭', '毁灭',
      '摧毁', '破坏', '损坏', '破损', '毁坏', '损害', '伤害', '危害', '损伤',
      '创伤', '伤口', '疤痕', '痕迹', '踪迹', '足迹', '迹象', '证据', '证明',
      '凭证', '凭据', '依据', '根据', '按照', '依照', '遵照', '遵循', '遵从',
      '遵守', '恪守', '坚守', '坚持', '保持', '维持', '持续', '继续', '连续',
      '不断', '不停', '一直', '始终', '永远', '永久', '永恒', '永远', '永久',
      '永恒', '长久', '长期', '短期', '暂时', '临时', '短暂', '瞬间', '刹那',
      '片刻', '须臾', '一会儿', '一下子', '一刹那', '转眼间', '转瞬间', '顷刻间',
      '一霎那', '一转眼', '一眨眼', '一晃眼', '一瞬间', '片刻间', '顷刻间',
      '转眼间', '转瞬间', '一霎那', '一转眼', '一眨眼', '一晃眼', '一瞬间',
      '很快', '迅速', '快速', '迅疾', '迅捷', '敏捷', '灵敏', '灵活', '灵巧',
      '麻利', '利落', '爽快', '干脆', '直截了当', '直接', '间接', '委婉', '含蓄',
      '婉转', '迂回', '曲折', '弯曲', '蜿蜒', '崎岖', '坎坷', '不平', '陡峭',
      '险峻', '险要', '高峻', '高耸', '巍峨', '雄伟', '宏伟', '宏大', '巨大',
      '庞大', '硕大', '伟大', '崇高', '高尚', '高贵', '高雅', '优雅', '优美',
      '美丽', '漂亮', '好看', '美观', '精致', '精巧', '精美', '精细', '细致',
      '细腻', '光滑', '平滑', '润滑', '滋润', '湿润', '潮湿', '干燥', '干枯',
      '干涸', '枯竭', '耗尽', '用完', '用尽', '用光', '花光', '耗费', '消耗',
      '消费', '花费', '支出', '开支', '开销', '费用', '成本', '代价', '价格',
      '价值', '价钱', '价位', '报价', '标价', '售价', '定价', '调价', '降价',
      '涨价', '提价', '加价', '减价', '折扣', '打折', '优惠', '让利', '降价',
      '促销', '推销', '销售', '出售', '售卖', '贩卖', '倒卖', '交易', '买卖',
      '生意', '业务', '营业', '经营', '运营', '运行', '运作', '操作', '操控',
      '控制', '掌控', '掌握', '把握', '抓住', '握紧', '拿住', '握住', '抓住',
      '捉住', '逮住', '抓住', '捕捉', '捕获', '擒获', '抓获', '捉拿', '逮捕',
      '拘捕', '拘留', '拘禁', '监禁', '囚禁', '关押', '软禁', '束缚', '约束',
      '限制', '限定', '局限', '制约', '控制', '抑制', '压制', '压抑', '压迫',
      '逼迫', '强迫', '强制', '迫使', '被逼', '被迫', '无奈', '无可奈何',
      '迫不得已', '身不由己', '不由自主', '情不自禁', '忍不住', '禁不住',
      '熬不住', '顶不住', '扛不住', '撑不住', '挺不住', '受不住', '忍不住',
      '禁不住', '熬不住', '顶不住', '扛不住', '撑不住', '挺不住', '受不住',
      '了', '着', '过', '的', '地', '得', '啊', '呀', '哇', '啦', '哦', '嗯',
      '哎', '唉', '嗨', '喂', '哟', '呢', '吗', '吧', '嘛', '呗', '呃', '呵',
      '嘿', '哼', '呀', '哇', '啦', '哦', '嗯', '啊', '哎', '唉', '嗨', '喂',
      '哟', '呢', '吗', '吧', '嘛', '呗', '呃', '呵', '嘿', '哼'
    ])
  }

  cleanHtml(html) {
    if (!html) return ''
    const $ = cheerio.load(html)
    $('script, style, noscript, iframe').remove()
    return $.text().replace(/\s+/g, ' ').trim()
  }

  tokenize(text) {
    const cleanText = text.toLowerCase()
    const words = cleanText.match(/[\u4e00-\u9fa5]{2,}|[a-zA-Z]{2,}/g) || []
    return words.filter(word => !this.stopWords.has(word) && word.length > 1)
  }

  extractKeywords(text, topN = 20) {
    const words = this.tokenize(text)
    const wordFreq = {}
    
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1
    })
    
    const sortedWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
    
    return sortedWords.map(([word, freq]) => ({ word, freq }))
  }

  calculateTFIDF(documents) {
    const docCount = documents.length
    const idf = {}
    
    documents.forEach(doc => {
      const words = new Set(this.tokenize(doc.text || ''))
      words.forEach(word => {
        idf[word] = (idf[word] || 0) + 1
      })
    })
    
    Object.keys(idf).forEach(word => {
      idf[word] = Math.log(docCount / (1 + idf[word]))
    })
    
    const tfidfVectors = documents.map(doc => {
      const words = this.tokenize(doc.text || '')
      const tf = {}
      const wordCount = words.length
      
      words.forEach(word => {
        tf[word] = (tf[word] || 0) + 1 / wordCount
      })
      
      const tfidf = {}
      Object.keys(tf).forEach(word => {
        if (idf[word]) {
          tfidf[word] = tf[word] * idf[word]
        }
      })
      
      return {
        id: doc.id,
        vector: tfidf
      }
    })
    
    return { tfidfVectors, idf }
  }
}

class ALSMatrixFactorization {
  constructor(numFactors = 20, iterations = 10, lambda = 0.1) {
    this.numFactors = numFactors
    this.iterations = iterations
    this.lambda = lambda
  }

  randomMatrix(rows, cols) {
    const matrix = []
    for (let i = 0; i < rows; i++) {
      const row = []
      for (let j = 0; j < cols; j++) {
        row.push(Math.random() * 0.1)
      }
      matrix.push(row)
    }
    return matrix
  }

  dotProduct(a, b) {
    let sum = 0
    for (let i = 0; i < a.length; i++) {
      sum += a[i] * b[i]
    }
    return sum
  }

  transpose(matrix) {
    const rows = matrix.length
    const cols = matrix[0].length
    const result = []
    for (let j = 0; j < cols; j++) {
      const row = []
      for (let i = 0; i < rows; i++) {
        row.push(matrix[i][j])
      }
      result.push(row)
    }
    return result
  }

  matrixMultiply(a, b) {
    const rowsA = a.length
    const colsA = a[0].length
    const colsB = b[0].length
    const result = []
    
    for (let i = 0; i < rowsA; i++) {
      const row = []
      for (let j = 0; j < colsB; j++) {
        let sum = 0
        for (let k = 0; k < colsA; k++) {
          sum += a[i][k] * b[k][j]
        }
        row.push(sum)
      }
      result.push(row)
    }
    return result
  }

  addIdentity(matrix, lambda) {
    const n = matrix.length
    const result = matrix.map(row => [...row])
    for (let i = 0; i < n; i++) {
      result[i][i] += lambda
    }
    return result
  }

  solveLeastSquares(A, b) {
    const n = A.length
    const augmented = A.map((row, i) => [...row, b[i]])
    
    for (let i = 0; i < n; i++) {
      let maxRow = i
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(augmented[j][i]) > Math.abs(augmented[maxRow][i])) {
          maxRow = j
        }
      }
      
      [augmented[i], augmented[maxRow]] = [augmented[maxRow], augmented[i]]
      
      const pivot = augmented[i][i]
      if (Math.abs(pivot) < 1e-10) continue
      
      for (let j = i; j <= n; j++) {
        augmented[i][j] /= pivot
      }
      
      for (let j = 0; j < n; j++) {
        if (j !== i && Math.abs(augmented[j][i]) > 1e-10) {
          const factor = augmented[j][i]
          for (let k = i; k <= n; k++) {
            augmented[j][k] -= factor * augmented[i][k]
          }
        }
      }
    }
    
    return augmented.map(row => row[n])
  }

  train(ratings, numUsers, numItems) {
    let U = this.randomMatrix(numUsers, this.numFactors)
    let V = this.randomMatrix(numItems, this.numFactors)
    
    const ratingByUser = {}
    const ratingByItem = {}
    
    ratings.forEach(rating => {
      if (!ratingByUser[rating.userId]) {
        ratingByUser[rating.userId] = []
      }
      ratingByUser[rating.userId].push(rating)
      
      if (!ratingByItem[rating.itemId]) {
        ratingByItem[rating.itemId] = []
      }
      ratingByItem[rating.itemId].push(rating)
    })
    
    for (let iter = 0; iter < this.iterations; iter++) {
      for (let u = 0; u < numUsers; u++) {
        const userRatings = ratingByUser[u] || []
        if (userRatings.length === 0) continue
        
        const Vsub = userRatings.map(r => V[r.itemId])
        const VtV = this.matrixMultiply(this.transpose(Vsub), Vsub)
        const VtR = this.transpose(Vsub)[0].map((_, i) => 
          userRatings.reduce((sum, r, j) => sum + Vsub[j][i] * r.rating, 0)
        )
        
        U[u] = this.solveLeastSquares(this.addIdentity(VtV, this.lambda * userRatings.length), VtR)
      }
      
      for (let i = 0; i < numItems; i++) {
        const itemRatings = ratingByItem[i] || []
        if (itemRatings.length === 0) continue
        
        const Usub = itemRatings.map(r => U[r.userId])
        const UtU = this.matrixMultiply(this.transpose(Usub), Usub)
        const UtR = this.transpose(Usub)[0].map((_, j) =>
          itemRatings.reduce((sum, r, k) => sum + Usub[k][j] * r.rating, 0)
        )
        
        V[i] = this.solveLeastSquares(this.addIdentity(UtU, this.lambda * itemRatings.length), UtR)
      }
    }
    
    return { U, V }
  }

  predict(U, V, userId, itemId) {
    return this.dotProduct(U[userId], V[itemId])
  }
}

class SimilarityCalculator {
  cosineSimilarity(vec1, vec2) {
    const keys1 = Object.keys(vec1)
    const keys2 = Object.keys(vec2)
    
    if (keys1.length === 0 || keys2.length === 0) return 0
    
    let dotProduct = 0
    let norm1 = 0
    let norm2 = 0
    
    const allKeys = new Set([...keys1, ...keys2])
    
    allKeys.forEach(key => {
      const v1 = vec1[key] || 0
      const v2 = vec2[key] || 0
      dotProduct += v1 * v2
      norm1 += v1 * v1
      norm2 += v2 * v2
    })
    
    if (norm1 === 0 || norm2 === 0) return 0
    
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
  }

  jaccardSimilarity(set1, set2) {
    const intersection = new Set([...set1].filter(x => set2.has(x)))
    const union = new Set([...set1, ...set2])
    return union.size === 0 ? 0 : intersection.size / union.size
  }

  hybridSimilarity(vec1, vec2, keywords1, keywords2) {
    const contentSim = this.cosineSimilarity(vec1, vec2)
    const keywordSet1 = new Set(keywords1.map(k => k.word))
    const keywordSet2 = new Set(keywords2.map(k => k.word))
    const keywordSim = this.jaccardSimilarity(keywordSet1, keywordSet2)
    
    return contentSim * 0.7 + keywordSim * 0.3
  }
}

class RecommendationService {
  constructor(db) {
    this.db = db
    this.textProcessor = new TextProcessor()
    this.similarityCalc = new SimilarityCalculator()
    this.als = new ALSMatrixFactorization(20, 10, 0.1)
    this.model = null
  }

  async extractArticleFeatures(article) {
    const content = this.textProcessor.cleanHtml(article.content || article.summary || article.title)
    const keywords = this.textProcessor.extractKeywords(content, 30)
    
    return {
      articleId: article.id,
      keywords,
      text: content
    }
  }

  async buildArticleFeatures() {
    const articles = this.db.getArticles()
    const docs = []
    
    for (const article of articles) {
      const content = this.textProcessor.cleanHtml(article.content || article.summary || article.title)
      docs.push({ id: article.id, text: content })
    }
    
    const { tfidfVectors } = this.textProcessor.calculateTFIDF(docs)
    
    for (const vec of tfidfVectors) {
      const article = articles.find(a => a.id === vec.id)
      const keywords = this.textProcessor.extractKeywords(
        docs.find(d => d.id === vec.id)?.text || '', 20
      )
      this.db.saveArticleFeatures(vec.id, keywords, vec.vector, article?.category)
    }
    
    return tfidfVectors.length
  }

  async calculateArticleSimilarities() {
    const features = this.db.getAllArticleFeatures()
    
    this.db.clearArticleSimilarity()
    
    for (let i = 0; i < features.length; i++) {
      for (let j = i + 1; j < features.length; j++) {
        const f1 = features[i]
        const f2 = features[j]
        
        const similarity = this.similarityCalc.hybridSimilarity(
          f1.tfidfVector,
          f2.tfidfVector,
          f1.keywords,
          f2.keywords
        )
        
        if (similarity > 0.1) {
          this.db.saveArticleSimilarity(f1.article_id, f2.article_id, similarity)
          this.db.saveArticleSimilarity(f2.article_id, f1.article_id, similarity)
        }
      }
    }
    
    return features.length
  }

  buildUserRatings() {
    const history = this.db.getReadingHistory()
    const articles = this.db.getArticles()
    
    const articleIndex = {}
    articles.forEach((a, i) => {
      articleIndex[a.id] = i
    })
    
    const ratings = []
    
    history.forEach(record => {
      let rating = 1
      
      if (record.is_starred) {
        rating = 5
      } else if (record.read_count >= 2) {
        rating = 4
      } else if (record.read_duration > 120) {
        rating = 4
      } else if (record.read_duration > 30) {
        rating = 3
      }
      
      const itemId = articleIndex[record.article_id]
      if (itemId !== undefined) {
        ratings.push({
          userId: 0,
          itemId,
          rating
        })
      }
    })
    
    return { ratings, articleIndex, numItems: articles.length }
  }

  async trainModel() {
    const featureCount = await this.buildArticleFeatures()
    if (featureCount === 0) return false
    
    await this.calculateArticleSimilarities()
    
    const { ratings, numItems } = this.buildUserRatings()
    if (ratings.length === 0) return false
    
    this.model = this.als.train(ratings, 1, numItems)
    
    const userVector = this.model.U[0]
    this.db.saveUserPreferences(userVector)
    
    return true
  }

  getRecommendations(limit = 20) {
    const articles = this.db.getArticlesForRecommendation()
    const features = this.db.getAllArticleFeatures()
    const userPrefs = this.db.getUserPreferences()
    
    const scoredArticles = articles.map(article => {
      const feature = features.find(f => f.article_id === article.id)
      let score = 0
      
      if (feature && userPrefs && userPrefs.featureVector) {
        const vec = feature.tfidfVector
        const keys = Object.keys(vec)
        const userVec = userPrefs.featureVector
        
        for (let i = 0; i < Math.min(keys.length, userVec.length); i++) {
          score += (vec[keys[i]] || 0) * (userVec[i] || 0.5)
        }
      }
      
      const timeFactor = 1 / (1 + (Date.now() - new Date(article.published_at).getTime()) / (1000 * 60 * 60 * 24 * 7))
      
      return {
        ...article,
        score: score * 0.7 + timeFactor * 0.3
      }
    })
    
    return scoredArticles
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }

  getSimilarArticles(articleId, limit = 10) {
    return this.db.getSimilarArticles(articleId, limit)
  }
}

export default RecommendationService
