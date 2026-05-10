const PRESET_COLORS = [
  '#DC143C',
  '#8B0000',
  '#1a1a1a',
  '#FFFFFF',
  '#FFD700',
  '#FFDAB9',
  '#F5DEB3',
  '#DEB887',
  '#4682B4',
  '#228B22',
  '#9932CC',
  '#FF8C00'
]

const COLOR_CULTURE = {
  '#DC143C': {
    name: '红色（朱红/大红）',
    meaning: '象征忠义、英勇、正直、热忱',
    description: '红色脸谱是京剧脸谱中最具代表性的颜色之一，主要用于塑造忠义、勇敢的正面人物形象。红色代表赤胆忠心，是英雄人物的标志性颜色。',
    characters: [
      { name: '关羽', desc: '《三国演义》中的关羽，忠义勇武，"桃园三结义"后追随刘备，"过五关斩六将"、"单刀赴会"等故事广为人知。红脸关羽已成为忠义的化身。' },
      { name: '姜维', desc: '《三国演义》中诸葛亮的传人，智勇双全，继承诸葛亮遗志北伐中原，是蜀汉后期的重要将领。' },
      { name: '孟良', desc: '《杨家将》中的孟良，与焦赞并称"焦不离孟，孟不离焦"，是杨延昭手下的得力战将。' }
    ],
    traits: ['忠义', '英勇', '正直', '热忱', '血性']
  },
  '#8B0000': {
    name: '深红色（枣红/绛红）',
    meaning: '象征老成持重、稳重大义',
    description: '深红色较之鲜红色更加沉稳，多用于塑造年长而稳重的忠义人物，或者具有特殊身份的正面角色。',
    characters: [
      { name: '赵匡胤', desc: '宋朝开国皇帝，"黄袍加身"、"杯酒释兵权"等典故流传千古。' },
      { name: '魏延', desc: '《三国演义》中的蜀汉将领，勇猛善战但性格孤傲。' }
    ],
    traits: ['稳重', '老练', '正直', '威严']
  },
  '#1a1a1a': {
    name: '黑色',
    meaning: '象征正直无私、刚正不阿、勇猛豪爽',
    description: '黑色脸谱主要用于塑造正直、铁面无私的人物，也可表示勇猛、鲁莽、豪爽的性格。黑色是公正的象征，代表不徇私情。',
    characters: [
      { name: '包拯（包公）', desc: '北宋名臣，以铁面无私、断案如神著称，"包青天"的形象深入人心。额头的月牙形标记象征"日断阳、夜断阴"。' },
      { name: '张飞', desc: '《三国演义》中的张飞，勇猛豪爽、粗中有细，"长坂坡一声吼"吓退曹军，是典型的黑脸谱代表人物。' },
      { name: '李逵', desc: '《水浒传》中的李逵，绰号"黑旋风"，性格鲁莽但忠直孝义，是梁山好汉中的重要人物。' }
    ],
    traits: ['正直', '无私', '刚正', '勇猛', '豪爽']
  },
  '#FFFFFF': {
    name: '白色',
    meaning: '象征奸诈多疑、阴险狡诈（贬义）；或象征年迈、神圣',
    description: '白色脸谱在京剧中多为贬义，用于塑造奸诈多疑的反面人物。但也有例外，如太监、和尚等特殊身份人物，或表示年老体弱。',
    characters: [
      { name: '曹操', desc: '《三国演义》中的曹操，乱世奸雄，"宁可我负天下人，不可天下人负我"是其经典台词，白脸曹操已成为奸臣的代名词。' },
      { name: '司马懿', desc: '《三国演义》中诸葛亮的主要对手，老谋深算、隐忍待时，最终为司马氏夺权奠定基础。' },
      { name: '赵高', desc: '秦朝宦官，"指鹿为马"的典故主角，是历史上著名的奸臣。' }
    ],
    traits: ['奸诈', '多疑', '老谋深算', '阴险']
  },
  '#FFD700': {
    name: '金色（黄色）',
    meaning: '象征神圣威严、尊贵超凡',
    description: '金色脸谱主要用于塑造神仙、佛祖、帝王等具有神圣或尊贵身份的人物，象征其超凡脱俗、与众不同的地位。',
    characters: [
      { name: '如来佛祖', desc: '佛教创始人，在《西游记》等神话剧目中以金色脸谱出现，象征至高无上的法力和智慧。' },
      { name: '二郎神', desc: '神话人物，玉帝外甥，有三只眼，神通广大，金色脸谱彰显其神仙身份。' },
      { name: '孙悟空（成佛后）', desc: '《西游记》中孙悟空取经成功后被封为"斗战胜佛"，金色脸谱代表其修成正果。' }
    ],
    traits: ['神圣', '威严', '尊贵', '超凡']
  },
  '#4682B4': {
    name: '蓝色',
    meaning: '象征刚强骁勇、有心计、桀骜不驯',
    description: '蓝色脸谱主要用于塑造刚强、勇猛但又有心计的人物，性格刚直不阿，有时带有叛逆色彩。',
    characters: [
      { name: '窦尔敦', desc: '清代传说中的绿林好汉，《盗御马》的主角，蓝脸形象已成为刚强勇猛的象征，"蓝脸的窦尔敦"更是家喻户晓。' },
      { name: '夏侯惇', desc: '《三国演义》中曹操的大将，勇猛善战，忠心耿耿。' },
      { name: '吕蒙', desc: '三国时期东吴名将，"士别三日，当刮目相看"的典故主角。' }
    ],
    traits: ['刚强', '骁勇', '有心计', '刚直']
  },
  '#228B22': {
    name: '绿色',
    meaning: '象征鲁莽暴躁、绿林好汉、侠义心肠',
    description: '绿色脸谱多用于塑造鲁莽暴躁但又有侠义心肠的人物，常见于绿林好汉、草莽英雄，象征其"不在五行中，跳出三界外"的身份。',
    characters: [
      { name: '程咬金', desc: '《隋唐演义》中的程咬金，绰号"混世魔王"，性格鲁莽但重情义，"三板斧"是其标志性技能。' },
      { name: '鲁智深', desc: '《水浒传》中的鲁智深，绰号"花和尚"，嫉恶如仇、见义勇为，"拳打镇关西"是其经典事迹。' },
      { name: '武松', desc: '《水浒传》中的武松，打虎英雄，崇尚忠义、有仇必报，"武松打虎"妇孺皆知。' }
    ],
    traits: ['鲁莽', '暴躁', '侠义', '刚猛']
  },
  '#9932CC': {
    name: '紫色',
    meaning: '象征肃穆稳重、智勇双全、刚正威严',
    description: '紫色脸谱介于红黑之间，既有红色的忠义，又有黑色的正直，多用于塑造智勇双全、沉稳老练的人物。',
    characters: [
      { name: '专诸', desc: '春秋时期著名刺客，"鱼腹藏剑"刺杀吴王僚，是"士为知己者死"的代表人物。' },
      { name: '张郃', desc: '三国时期魏国名将，智勇双全，以用兵巧变著称。' },
      { name: '杨延嗣', desc: '《杨家将》中的杨七郎，勇猛善战，最终被潘仁美乱箭射死，悲剧英雄形象。' }
    ],
    traits: ['肃穆', '稳重', '智勇', '刚正']
  },
  '#FF8C00': {
    name: '橙色/黄色',
    meaning: '象征勇猛善战、残忍凶暴、或神仙武将',
    description: '橙色（或赭黄色）脸谱多用于塑造勇猛善战但性格凶暴的武将，也可用于某些具有特殊身份的神仙或老年人物。',
    characters: [
      { name: '典韦', desc: '《三国演义》中曹操的贴身护卫，勇猛无比，人称"古之恶来"，宛城之战中力战身亡。' },
      { name: '许褚', desc: '《三国演义》中曹操的护卫，绰号"虎痴"，与马超大战数百回合不分胜负。' }
    ],
    traits: ['勇猛', '善战', '刚烈']
  },
  '#FFDAB9': {
    name: '粉色/桃红',
    meaning: '象征年迈忠良、德高望重',
    description: '粉色脸谱是红色脸谱的变体，用于塑造年迈但仍忠心耿耿的老将，象征其虽年老但宝刀未老、忠心不改。',
    characters: [
      { name: '黄忠', desc: '《三国演义》中的老将黄忠，年逾六十仍勇猛善战，"百步穿杨"的箭法更是出神入化。' },
      { name: '严颜', desc: '《三国演义》中川中名将，后归降刘备，"宁做断头将军，不做投降将军"彰显其气节。' }
    ],
    traits: ['年迈', '忠良', '德高望重']
  },
  '#F5DEB3': {
    name: '肉色/本色',
    meaning: '象征普通人、无特殊性格或用于勾边',
    description: '肉色或接近肤色的颜色多用于没有强烈性格特征的普通人，或者作为脸谱的底色、过渡色使用。',
    characters: [
      { name: '普通角色', desc: '一般用于龙套、次要角色，或者作为脸谱的底色，让其他颜色的图案更加突出。' }
    ],
    traits: ['普通', '中性', '温和']
  },
  '#DEB887': {
    name: '褐色/赭色',
    meaning: '象征老诚持重、或用于僧人、老者',
    description: '褐色脸谱多用于塑造老成持重的人物，也可用于僧人、和尚等特殊身份，或者表示年迈体弱。',
    characters: [
      { name: '老年角色', desc: '常用于需要表现稳重、老练的老年人物，或者作为其他颜色的过渡。' }
    ],
    traits: ['老成', '持重', '稳重']
  }
}

function getColorCulture(color) {
  return COLOR_CULTURE[color] || COLOR_CULTURE[color.toUpperCase()] || null
}

const TEXTURE_TYPES = [
  { id: 'solid', name: '纯色', pattern: null },
  { id: 'cloud', name: '云纹', pattern: 'cloud' },
  { id: 'dot', name: '点阵', pattern: 'dot' },
  { id: 'stripe', name: '条纹', pattern: 'stripe' },
  { id: 'wave', name: '波浪', pattern: 'wave' }
]

const DEFAULT_REGIONS = [
  { id: 'face', name: '面部底色', x: 60, y: 70, width: 280, height: 360, defaultColor: '#F5DEB3' },
  { id: 'forehead', name: '额头', x: 140, y: 80, width: 120, height: 100, defaultColor: '#F5DEB3' },
  { id: 'left_eye_socket', name: '左眼框', x: 115, y: 175, width: 70, height: 50, defaultColor: '#FFFFFF' },
  { id: 'right_eye_socket', name: '右眼框', x: 215, y: 175, width: 70, height: 50, defaultColor: '#FFFFFF' },
  { id: 'left_cheek', name: '左脸颊', x: 75, y: 225, width: 90, height: 110, defaultColor: '#F5DEB3' },
  { id: 'right_cheek', name: '右脸颊', x: 235, y: 225, width: 90, height: 110, defaultColor: '#F5DEB3' },
  { id: 'mouth', name: '嘴部', x: 165, y: 335, width: 70, height: 30, defaultColor: '#8B0000' }
]

function createPattern(ctx, type, color, regionWidth, regionHeight) {
  const patternSize = 80
  const patternCanvas = document.createElement('canvas')
  patternCanvas.width = patternSize
  patternCanvas.height = patternSize
  const pCtx = patternCanvas.getContext('2d')

  pCtx.imageSmoothingEnabled = true
  pCtx.imageSmoothingQuality = 'high'

  pCtx.fillStyle = color
  pCtx.fillRect(0, 0, patternSize, patternSize)

  const accentColor = adjustColor(color, -25)

  switch (type) {
    case 'cloud':
      pCtx.fillStyle = accentColor
      drawSeamlessCloudPattern(pCtx, patternSize)
      break
    case 'dot':
      pCtx.fillStyle = accentColor
      drawSeamlessDotPattern(pCtx, patternSize)
      break
    case 'stripe':
      pCtx.fillStyle = accentColor
      drawSeamlessStripePattern(pCtx, patternSize)
      break
    case 'wave':
      pCtx.strokeStyle = accentColor
      pCtx.lineWidth = 1.5
      drawSeamlessWavePattern(pCtx, patternSize)
      break
  }

  const pattern = ctx.createPattern(patternCanvas, 'repeat')
  return pattern
}

function drawSeamlessCloudPattern(ctx, size) {
  const cloudSize = size / 4
  const offset = size / 2

  drawCloud(ctx, offset, offset, cloudSize * 0.6)
  drawCloud(ctx, 0, 0, cloudSize * 0.45)
  drawCloud(ctx, size, 0, cloudSize * 0.45)
  drawCloud(ctx, 0, size, cloudSize * 0.45)
  drawCloud(ctx, size, size, cloudSize * 0.45)

  drawCloud(ctx, size * 0.25, size * 0.75, cloudSize * 0.35)
  drawCloud(ctx, size * 0.75, size * 0.25, cloudSize * 0.35)
  drawCloud(ctx, size * 0.25, size * 0.25, cloudSize * 0.3)
  drawCloud(ctx, size * 0.75, size * 0.75, cloudSize * 0.3)
}

function drawCloud(ctx, x, y, r) {
  ctx.beginPath()
  ctx.arc(x, y, r * 0.6, 0, Math.PI * 2)
  ctx.arc(x + r * 0.5, y - r * 0.2, r * 0.5, 0, Math.PI * 2)
  ctx.arc(x + r, y, r * 0.6, 0, Math.PI * 2)
  ctx.arc(x + r * 0.5, y + r * 0.3, r * 0.45, 0, Math.PI * 2)
  ctx.fill()
}

function drawSeamlessDotPattern(ctx, size) {
  const spacing = 20
  const radius = 3

  for (let y = -spacing; y < size + spacing; y += spacing) {
    for (let x = -spacing; x < size + spacing; x += spacing) {
      const offsetX = (y / spacing) % 2 === 0 ? 0 : spacing / 2
      ctx.beginPath()
      ctx.arc(x + offsetX, y, radius, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function drawSeamlessStripePattern(ctx, size) {
  const stripeWidth = 6
  const gap = 10

  for (let x = -stripeWidth; x < size + stripeWidth; x += stripeWidth + gap) {
    ctx.fillRect(x, 0, stripeWidth, size)
  }
}

function drawSeamlessWavePattern(ctx, size) {
  const amplitude = 5
  const frequency = 0.1
  const lineSpacing = 15

  for (let y = -lineSpacing; y < size + lineSpacing; y += lineSpacing) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    for (let x = 0; x <= size; x += 2) {
      const waveY = y + Math.sin(x * frequency) * amplitude
      ctx.lineTo(x, waveY)
    }
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, y + Math.sin(0) * amplitude + size)
    for (let x = 0; x <= size; x += 2) {
      const waveY = y + Math.sin(x * frequency) * amplitude + size
      ctx.lineTo(x, waveY)
    }
    ctx.stroke()

    ctx.beginPath()
    ctx.moveTo(0, y + Math.sin(0) * amplitude - size)
    for (let x = 0; x <= size; x += 2) {
      const waveY = y + Math.sin(x * frequency) * amplitude - size
      ctx.lineTo(x, waveY)
    }
    ctx.stroke()
  }
}

function adjustColor(color, amount) {
  const hex = color.replace('#', '')
  const r = Math.max(0, Math.min(255, parseInt(hex.slice(0, 2), 16) + amount))
  const g = Math.max(0, Math.min(255, parseInt(hex.slice(2, 4), 16) + amount))
  const b = Math.max(0, Math.min(255, parseInt(hex.slice(4, 6), 16) + amount))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

function drawMaskBase(ctx, width, height) {
  const cx = width / 2
  const cy = height / 2

  ctx.save()
  
  const gradient = ctx.createRadialGradient(cx, cy - 50, 50, cx, cy, 200)
  gradient.addColorStop(0, '#FFF5EE')
  gradient.addColorStop(1, '#FFE4C4')
  
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.ellipse(cx, cy, 140, 180, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 3
  ctx.stroke()

  ctx.restore()
}

function drawRegion(ctx, region, color, texture, isSelected) {
  ctx.save()

  const fillStyle = texture && texture !== 'solid' 
    ? createPattern(ctx, texture, color, region.width, region.height)
    : color

  ctx.fillStyle = fillStyle

  if (region.id === 'face') {
    drawFaceRegion(ctx, region, isSelected)
  } else if (region.id === 'forehead') {
    drawForeheadRegion(ctx, region, isSelected)
  } else if (region.id === 'left_eye_socket' || region.id === 'right_eye_socket') {
    drawEyeSocketRegion(ctx, region, isSelected)
  } else if (region.id === 'left_cheek' || region.id === 'right_cheek') {
    drawCheekRegion(ctx, region, isSelected)
  } else if (region.id === 'mouth') {
    drawMouthRegion(ctx, region, isSelected)
  } else {
    ctx.fillRect(region.x, region.y, region.width, region.height)
    if (isSelected) {
      ctx.strokeStyle = '#8B0000'
      ctx.lineWidth = 3
      ctx.setLineDash([5, 5])
      ctx.strokeRect(region.x, region.y, region.width, region.height)
    }
  }

  ctx.restore()
}

function drawFaceRegion(ctx, region, isSelected) {
  const cx = region.x + region.width / 2
  const cy = region.y + region.height / 2
  const rx = region.width / 2 - 10
  const ry = region.height / 2 - 10

  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  ctx.fill()

  if (isSelected) {
    ctx.strokeStyle = '#8B0000'
    ctx.lineWidth = 3
    ctx.setLineDash([5, 5])
    ctx.stroke()
  }
}

function drawForeheadRegion(ctx, region, isSelected) {
  const cx = region.x + region.width / 2
  const y1 = region.y
  const y2 = region.y + region.height
  const x1 = region.x + 10
  const x2 = region.x + region.width - 10

  ctx.beginPath()
  ctx.moveTo(cx, y1)
  ctx.quadraticCurveTo(x2, y1 + 10, x2 + 15, y1 + 40)
  ctx.quadraticCurveTo(x2, y2 - 20, cx, y2)
  ctx.quadraticCurveTo(x1, y2 - 20, x1 - 15, y1 + 40)
  ctx.quadraticCurveTo(x1, y1 + 10, cx, y1)
  ctx.fill()

  if (isSelected) {
    ctx.strokeStyle = '#8B0000'
    ctx.lineWidth = 3
    ctx.setLineDash([5, 5])
    ctx.stroke()
  }
}

function drawEyeSocketRegion(ctx, region, isSelected) {
  const cx = region.x + region.width / 2
  const cy = region.y + region.height / 2
  const rx = region.width / 2 - 5
  const ry = region.height / 2 - 5

  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = '#000'
  ctx.beginPath()
  ctx.arc(cx, cy, 8, 0, Math.PI * 2)
  ctx.fill()

  if (isSelected) {
    ctx.strokeStyle = '#8B0000'
    ctx.lineWidth = 3
    ctx.setLineDash([5, 5])
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx + 5, ry + 5, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
}

function drawCheekRegion(ctx, region, isSelected) {
  const cx = region.x + region.width / 2
  const cy = region.y + region.height / 2
  const rx = region.width / 2
  const ry = region.height / 2

  ctx.beginPath()
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
  ctx.fill()

  if (isSelected) {
    ctx.strokeStyle = '#8B0000'
    ctx.lineWidth = 3
    ctx.setLineDash([5, 5])
    ctx.stroke()
  }
}

function drawMouthRegion(ctx, region, isSelected) {
  const cx = region.x + region.width / 2
  const y = region.y + region.height / 2

  ctx.beginPath()
  ctx.moveTo(region.x, y)
  ctx.quadraticCurveTo(cx, y + 20, region.x + region.width, y)
  ctx.quadraticCurveTo(cx, y + 25, region.x, y)
  ctx.fill()

  if (isSelected) {
    ctx.strokeStyle = '#8B0000'
    ctx.lineWidth = 3
    ctx.setLineDash([5, 5])
    ctx.strokeRect(region.x - 2, region.y - 2, region.width + 4, region.height + 4)
  }
}

function drawDecorativeLines(ctx, width, height) {
  ctx.save()
  ctx.strokeStyle = '#333'
  ctx.lineWidth = 2

  const cx = width / 2

  ctx.beginPath()
  ctx.moveTo(cx - 40, 140)
  ctx.quadraticCurveTo(cx, 120, cx + 40, 140)
  ctx.stroke()

  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(cx - 35, 155)
  ctx.lineTo(cx - 30, 165)
  ctx.moveTo(cx, 150)
  ctx.lineTo(cx, 170)
  ctx.moveTo(cx + 30, 165)
  ctx.lineTo(cx + 35, 155)
  ctx.stroke()

  ctx.restore()
}

function renderMask(ctx, width, height, regions, regionStyles) {
  ctx.clearRect(0, 0, width, height)

  drawMaskBase(ctx, width, height)

  regions.forEach(region => {
    const style = regionStyles[region.id] || {
      color: region.defaultColor,
      texture: 'solid'
    }
    drawRegion(ctx, region, style.color, style.texture, style.selected)
  })

  drawDecorativeLines(ctx, width, height)
}

function getRegionAtPoint(regions, x, y) {
  for (let i = regions.length - 1; i >= 0; i--) {
    const region = regions[i]
    if (x >= region.x && x <= region.x + region.width &&
        y >= region.y && y <= region.y + region.height) {
      return region
    }
  }
  return null
}

export {
  PRESET_COLORS,
  TEXTURE_TYPES,
  DEFAULT_REGIONS,
  COLOR_CULTURE,
  renderMask,
  getRegionAtPoint,
  drawRegion,
  adjustColor,
  getColorCulture
}
