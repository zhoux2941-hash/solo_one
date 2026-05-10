
// 古琴13个徽位的位置比例（从岳山到龙龈的比例）
// 理论比例：基于纯律（Just Intonation）
const HUI_THEORETICAL_RATIOS = {
  1: { numerator: 1, denominator: 8, name: '一徽' },
  2: { numerator: 1, denominator: 6, name: '二徽' },
  3: { numerator: 1, denominator: 5, name: '三徽' },
  4: { numerator: 1, denominator: 4, name: '四徽' },
  5: { numerator: 1, denominator: 3, name: '五徽' },
  6: { numerator: 2, denominator: 5, name: '六徽' },
  7: { numerator: 1, denominator: 2, name: '七徽' },
  8: { numerator: 3, denominator: 5, name: '八徽' },
  9: { numerator: 2, denominator: 3, name: '九徽' },
  10: { numerator: 3, denominator: 4, name: '十徽' },
  11: { numerator: 4, denominator: 5, name: '十一徽' },
  12: { numerator: 5, denominator: 6, name: '十二徽' },
  13: { numerator: 7, denominator: 8, name: '十三徽' }
}

// 徽位区域描述
const HUI_REGION = {
  upper: { name: '岳山区', huiNumbers: [1, 2, 3, 4, 5, 6], description: '靠近岳山的高音区' },
  middle: { name: '中央区', huiNumbers: [7], description: '七徽，琴的中央位置' },
  lower: { name: '龙龈区', huiNumbers: [8, 9, 10, 11, 12, 13], description: '靠近龙龈的低音区' }
}

// 获取徽位所在区域
function getHuiRegion(huiNumber) {
  if (huiNumber <= 6) return HUI_REGION.upper
  if (huiNumber === 7) return HUI_REGION.middle
  return HUI_REGION.lower
}

// 计算徽位位置
export function calculateHuiPositions(stringLength) {
  const positions = []
  
  for (let hui = 1; hui <= 13; hui++) {
    const ratio = HUI_THEORETICAL_RATIOS[hui]
    const positionFromYueshan = stringLength * (ratio.numerator / ratio.denominator)
    const positionFromLongyin = stringLength - positionFromYueshan
    
    positions.push({
      huiNumber: hui,
      name: ratio.name,
      ratio: `${ratio.numerator}/${ratio.denominator}`,
      ratioValue: ratio.numerator / ratio.denominator,
      positionFromYueshan: parseFloat(positionFromYueshan.toFixed(2)),
      positionFromLongyin: parseFloat(positionFromLongyin.toFixed(2)),
      stringLength: stringLength
    })
  }
  
  return positions
}

// 计算理论频率
export function calculateTheoreticalFrequency(baseFrequency, huiNumber) {
  if (!HUI_THEORETICAL_RATIOS[huiNumber]) {
    return null
  }
  
  const ratio = HUI_THEORETICAL_RATIOS[huiNumber]
  const frequencyRatio = ratio.denominator / ratio.numerator
  return baseFrequency * frequencyRatio
}

// 计算音分偏差
export function calculateCentDeviation(measuredFrequency, theoreticalFrequency) {
  if (theoreticalFrequency <= 0 || measuredFrequency <= 0) {
    return 0
  }
  return 1200 * Math.log2(measuredFrequency / theoreticalFrequency)
}

// 音准评价等级
const PITCH_LEVELS = [
  {
    maxDeviation: 3,
    level: 'excellent',
    displayName: '完美',
    emoji: '🎯',
    color: '#48bb78',
    description: '音准极佳，达到专业演奏标准'
  },
  {
    maxDeviation: 8,
    level: 'very_good',
    displayName: '非常好',
    emoji: '✨',
    color: '#38a169',
    description: '音准很好，可以直接用于演奏'
  },
  {
    maxDeviation: 15,
    level: 'good',
    displayName: '良好',
    emoji: '👍',
    color: '#4299e1',
    description: '音准良好，基本满足演奏需求'
  },
  {
    maxDeviation: 25,
    level: 'acceptable',
    displayName: '可接受',
    emoji: '🙂',
    color: '#ed8936',
    description: '略有偏差，建议微调'
  },
  {
    maxDeviation: 40,
    level: 'needs_tuning',
    displayName: '需要调整',
    emoji: '🔧',
    color: '#dd6b20',
    description: '偏差较为明显，建议调音'
  },
  {
    maxDeviation: Infinity,
    level: 'significant',
    displayName: '偏差较大',
    emoji: '💡',
    color: '#e53e3e',
    description: '需要系统调音或检查'
  }
]

// 获取音准等级
function getPitchLevel(centDeviation) {
  const absDeviation = Math.abs(centDeviation)
  return PITCH_LEVELS.find(level => absDeviation <= level.maxDeviation) || PITCH_LEVELS[PITCH_LEVELS.length - 1]
}

// 鼓励语库
const ENCOURAGEMENTS = {
  excellent: [
    '太棒了！', '完美！', '琴音纯净！', '这就是天籁之音！', '您的琴已经调得非常好了！'
  ],
  very_good: [
    '做得很好！', '琴音很准！', '继续保持！', '您已经接近完美了！', '很好，再微调一下就完美了！'
  ],
  good: [
    '不错哦！', '很好的开始！', '基本音准没问题！', '可以了，稍加调整会更好！'
  ],
  acceptable: [
    '没问题，慢慢来！', '差一点点就更好了！', '加油，再调一下！', '很接近了！'
  ],
  needs_tuning: [
    '别担心，这很常见！', '让我们一起来调整一下！', '这正是调音的意义所在！', '每把琴都需要精心呵护！'
  ],
  significant: [
    '没关系，这是正常的！', '让我们一起把琴调得更好！', '这是一个很好的学习机会！', '每把好琴都需要耐心调音！'
  ]
}

// 随机获取鼓励语
function getEncouragement(level) {
  const list = ENCOURAGEMENTS[level] || ENCOURAGEMENTS.good
  return list[Math.floor(Math.random() * list.length)]
}

// 琴轸调整建议
const QIN_ZHEN_ADVICE = {
  sharp: {
    slight: {
      text: '可以用指尖轻轻按住琴轸，向自己方向（紧弦）微微转动一点点',
      detail: '建议每次只转动1/8圈，然后再测试音高'
    },
    moderate: {
      text: '可以用指尖按住琴轸，向自己方向（紧弦）转动约1/4圈',
      detail: '转动后用右手手指轻拨琴弦，检查音高变化'
    },
    significant: {
      text: '需要向自己方向（紧弦）转动琴轸约半圈',
      detail: '转动时注意力度，避免琴弦过紧断裂'
    }
  },
  flat: {
    slight: {
      text: '可以用指尖轻轻按住琴轸，向前方（松弦）微微转动一点点',
      detail: '建议每次只转动1/8圈，然后再测试音高'
    },
    moderate: {
      text: '可以用指尖按住琴轸，向前方（松弦）转动约1/4圈',
      detail: '转动后用右手手指轻拨琴弦，检查音高变化'
    },
    significant: {
      text: '需要向前方（松弦）转动琴轸约半圈',
      detail: '注意不要太松，琴弦应保持适当张力'
    }
  }
}

// 岳山/龙龈区域调整建议
const REGION_ADVICE = {
  upper: {
    flat: {
      title: '岳山区低音问题',
      description: '靠近岳山的徽位音偏低，这在古琴中是常见现象',
      solutions: [
        '如果只是个别徽位偏低，可能是琴面弧度问题，需要专业斫琴师调整',
        '可以尝试微调岳山高度（需要专业工具）',
        '如果是新琴，这可能是正常现象，随着时间推移会逐渐稳定',
        '建议先调整琴轸，观察整体音准变化'
      ]
    },
    sharp: {
      title: '岳山区高音问题',
      description: '靠近岳山的徽位音偏高，可能是琴面或岳山位置需要调整',
      solutions: [
        '检查岳山是否过高，过高会导致高音区偏紧',
        '可以尝试在岳山下方垫一小块牛皮降低高度（专业操作）',
        '建议先通过琴轸调整整体音高',
        '如问题持续，建议咨询专业斫琴师'
      ]
    }
  },
  middle: {
    flat: {
      title: '中央区音低',
      description: '七徽是琴的中心位置，这个位置的音高关系到整体音准',
      solutions: [
        '先尝试调整琴轸，这是最简单有效的方法',
        '如果琴轸调整后其他徽位问题更大，可能是有效弦长问题',
        '检查雁足位置是否正确，雁足偏右会导致弦长变短',
        '建议先微调琴轸，再观察其他徽位变化'
      ]
    },
    sharp: {
      title: '中央区音高',
      description: '七徽位置的音高是整根琴弦的基准',
      solutions: [
        '先尝试通过琴轸放松琴弦',
        '如果整体偏高，可以考虑移动雁足位置',
        '雁足向左移动可以增加有效弦长，降低音高',
        '建议先小范围调整琴轸'
      ]
    }
  },
  lower: {
    flat: {
      title: '龙龈区低音问题',
      description: '靠近龙龈的徽位音偏低，需要检查龙龈位置',
      solutions: [
        '检查龙龈是否过高或位置偏右',
        '龙龈过高会导致低音区弦长相对变短',
        '可以尝试微调龙龈位置（专业操作）',
        '如果是新琴，建议先让琴适应环境一段时间'
      ]
    },
    sharp: {
      title: '龙龈区高音问题',
      description: '靠近龙龈的徽位音偏高，需要检查龙龈高度',
      solutions: [
        '检查龙龈是否过低',
        '龙龈过低会导致低音区弦长相对变长',
        '可以尝试在龙龈下方垫薄木片抬高（专业操作）',
        '建议先通过琴轸调整，观察整体效果'
      ]
    }
  }
}

// 生成调音建议（详细版）
export function generateTuningAdviceDetail(centDeviation, huiNumber, stringName = null) {
  const absDeviation = Math.abs(centDeviation)
  const isSharp = centDeviation > 0  // 偏高
  const isFlat = centDeviation < 0   // 偏低
  const pitchLevel = getPitchLevel(centDeviation)
  const huiInfo = HUI_THEORETICAL_RATIOS[huiNumber]
  const region = getHuiRegion(huiNumber)
  const direction = isSharp ? 'sharp' : 'flat'
  const encouragement = getEncouragement(pitchLevel.level)
  
  // 基础信息
  const result = {
    centDeviation: centDeviation,
    absDeviation: absDeviation,
    huiNumber: huiNumber,
    huiName: huiInfo ? huiInfo.name : `${huiNumber}徽`,
    region: region.name,
    isSharp: isSharp,
    isFlat: isFlat,
    pitchLevel: pitchLevel,
    encouragement: encouragement,
    summary: '',
    primaryAdvice: '',
    detailedSteps: [],
    warnings: [],
    tips: [],
    fullText: ''
  }
  
  // 根据偏差程度生成建议
  let severity = 'slight'
  if (absDeviation >= 30) severity = 'significant'
  else if (absDeviation >= 15) severity = 'moderate'
  
  // 生成摘要
  if (absDeviation < 5) {
    result.summary = `${encouragement} ${pitchLevel.displayName}！偏差仅${absDeviation.toFixed(1)}音分，音准非常好。`
    result.primaryAdvice = pitchLevel.description
    result.fullText = `${encouragement} ${result.huiName}音准${pitchLevel.displayName}！偏差${absDeviation.toFixed(1)}音分，完全符合演奏标准。`
    return result
  }
  
  // 生成主要建议
  const directionText = isSharp ? '略高' : '略低'
  result.summary = `${encouragement} ${result.huiName}${directionText}${absDeviation.toFixed(1)}音分，建议微调。`
  
  // 根据区域和偏差方向获取详细建议
  const regionAdvice = REGION_ADVICE[region.name === '岳山区' ? 'upper' : region.name === '龙龈区' ? 'lower' : 'middle'][direction]
  const zhenAdvice = QIN_ZHEN_ADVICE[direction][severity]
  
  // 组装详细步骤
  result.detailedSteps = [
    {
      title: '第一步：调整琴轸',
      content: zhenAdvice.text,
      detail: zhenAdvice.detail
    }
  ]
  
  // 如果是七徽或偏差较大，添加区域建议
  if (absDeviation >= 30 || huiNumber === 7) {
    result.detailedSteps.push({
      title: `第二步：检查${region.name}`,
      content: regionAdvice.description,
      solutions: regionAdvice.solutions
    })
  }
  
  // 添加通用提示
  result.tips = [
    '每次调整后都要重新检测音高',
    '调整时保持耐心，小幅度多次调整效果更好',
    '建议在安静环境下调音，避免外界干扰',
    '可以参考泛音来判断音准，泛音更加纯净稳定'
  ]
  
  // 添加注意事项
  if (absDeviation >= 40) {
    result.warnings = [
      '⚠️ 偏差较大，可能不是单纯的琴轸调整问题',
      '⚠️ 如果多个徽位都有类似问题，建议检查有效弦长',
      '⚠️ 新琴或换季时音准变化较大是正常现象',
      '⚠️ 如问题持续，建议咨询专业斫琴师或调琴师'
    ]
  }
  
  // 生成完整文本
  const adviceTexts = [
    result.summary,
    '',
    '【建议操作】',
    result.detailedSteps.map((step, index) => {
      let text = `${index + 1}. ${step.title}：${step.content}`
      if (step.detail) text += `（${step.detail}）`
      return text
    }).join('\n')
  ]
  
  if (result.warnings.length > 0) {
    adviceTexts.push('', '【注意事项】')
    adviceTexts.push(result.warnings.join('\n'))
  }
  
  adviceTexts.push('', '【温馨提示】')
  adviceTexts.push(result.tips.join('\n'))
  
  result.fullText = adviceTexts.join('\n')
  
  return result
}

// 生成简洁调音建议
export function generateTuningAdvice(centDeviation, huiNumber) {
  const absDeviation = Math.abs(centDeviation)
  const isSharp = centDeviation > 0
  const huiInfo = HUI_THEORETICAL_RATIOS[huiNumber]
  const huiName = huiInfo ? huiInfo.name : `${huiNumber}徽`
  
  if (absDeviation < 5) {
    return '🎯 完美！音准极佳，无需调整'
  } else if (absDeviation < 10) {
    return `✨ 很好！偏差${absDeviation.toFixed(1)}音分，基本完美，可轻微调整琴轸`
  } else if (absDeviation < 20) {
    const direction = isSharp ? '向自己方向（紧弦）' : '向前方（松弦）'
    return `👍 不错！${huiName}${isSharp ? '偏高' : '偏低'}${absDeviation.toFixed(1)}音分，建议${direction}微微转动琴轸`
  } else if (absDeviation < 35) {
    const direction = isSharp ? '紧弦' : '松弦'
    return `🙂 需要微调：${huiName}${isSharp ? '偏高' : '偏低'}${absDeviation.toFixed(1)}音分，建议${direction}约1/4圈琴轸`
  } else {
    const region = huiNumber <= 6 ? '岳山' : huiNumber === 7 ? '七徽' : '龙龈'
    const direction = isSharp ? '偏高' : '偏低'
    return `💡 ${region}区域${direction}${absDeviation.toFixed(1)}音分。建议先调整琴轸，如问题持续，可能需要检查${region}位置或琴面弧度。`
  }
}

// 获取徽位信息
export function getHuiInfo(huiNumber) {
  return HUI_THEORETICAL_RATIOS[huiNumber] || null
}

// 获取所有徽位信息
export function getAllHuiInfo() {
  return Object.entries(HUI_THEORETICAL_RATIOS).map(([key, value]) => ({
    huiNumber: parseInt(key),
    ...value
  }))
}

// 获取调音建议的友好描述
export function getPitchLevelDescription(centDeviation) {
  return getPitchLevel(centDeviation)
}
