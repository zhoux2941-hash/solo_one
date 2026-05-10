/**
 * 轮廓曲线修复工具
 * 解决自相交（回勾线）导致的 3D 渲染问题
 */

/**
 * 检测并修复自相交的轮廓
 * Three.js LatheGeometry 需要单调曲线（y 单调变化）
 * 
 * 策略：
 * 1. 检测 y 值是否严格递增/递减
 * 2. 对于回勾部分（y 开始回退），取该 y 范围内的最大 x（或平均）
 * 3. 最终生成单调曲线
 */
export function sanitizeProfile(points) {
  if (!points || points.length < 2) {
    return {
      sanitized: points || [],
      hasIssue: false,
      issueRegions: []
    }
  }

  // 1. 首先判断方向：是从下往上画（y 增大）还是从上往下画（y 减小）
  const isAscending = points[points.length - 1].y > points[0].y

  // 2. 按 y 值排序，找到每个 y 的最佳 x 值
  const sortedPoints = [...points].sort((a, b) => a.y - b.y)

  const issueRegions = []
  let prevY = sortedPoints[0].y
  let currentYGroup = [sortedPoints[0]]
  const yGroups = [currentYGroup]

  // 3. 按 y 值分组（容差 1px）
  for (let i = 1; i < sortedPoints.length; i++) {
    const p = sortedPoints[i]
    if (Math.abs(p.y - prevY) < 1) {
      currentYGroup.push(p)
    } else {
      currentYGroup = [p]
      yGroups.push(currentYGroup)
      prevY = p.y
    }
  }

  // 4. 检测是否有自相交（同一个 y 范围有多个不同的 x 值）
  const sanitized = []
  
  yGroups.forEach((group, groupIndex) => {
    if (group.length > 1) {
      // 检测这个 y 层是否有异常大的 x 跨度
      const xs = group.map(p => p.x)
      const minX = Math.min(...xs)
      const maxX = Math.max(...xs)
      const xSpan = maxX - minX
      
      if (xSpan > 5) {
        // 这是一个自相交区域！
        issueRegions.push({
          startY: group[0].y,
          endY: group[group.length - 1].y,
          type: 'self_intersect'
        })
        
        // 策略：取最大的 x（外轮廓），这样 3D 会更饱满
        const maxXPoint = group.reduce((max, p) => p.x > max.x ? p : max, group[0])
        sanitized.push({
          x: maxXPoint.x,
          y: (group[0].y + group[group.length - 1].y) / 2
        })
        return
      }
    }
    
    // 正常情况：取第一个点
    sanitized.push({
      x: group[0].x,
      y: group[0].y
    })
  })

  // 5. 进一步检测是否有回勾（y 值不是单调的）
  const finalSanitized = []
  let lastY = isAscending ? -Infinity : Infinity
  let isInLoop = false
  let loopStartIdx = -1

  for (let i = 0; i < points.length; i++) {
    const p = points[i]
    const isGoingBack = isAscending 
      ? p.y < lastY - 2  // 回退超过 2px 才认为是回勾
      : p.y > lastY + 2

    if (isGoingBack && !isInLoop) {
      // 开始回勾
      isInLoop = true
      loopStartIdx = i
      issueRegions.push({
        startY: Math.min(p.y, lastY),
        endY: Math.max(p.y, lastY),
        type: 'loop_back'
      })
    } else if (!isGoingBack && isInLoop) {
      // 回勾结束
      isInLoop = false
    }

    // 如果在回勾中，跳过这个点（不加入最终曲线）
    if (isInLoop) {
      continue
    }

    // 更新 lastY
    if ((isAscending && p.y > lastY) || (!isAscending && p.y < lastY)) {
      lastY = p.y
      finalSanitized.push({ x: p.x, y: p.y })
    }
  }

  const result = finalSanitized.length > 1 ? finalSanitized : sanitized

  return {
    sanitized: result,
    hasIssue: issueRegions.length > 0,
    issueRegions
  }
}

/**
 * 简化轮廓点（减少点数）
 * 使用距离阈值，距离太近的点合并
 */
export function simplifyProfile(points, minDistance = 2) {
  if (!points || points.length < 2) {
    return points || []
  }

  const simplified = [points[0]]
  let lastPoint = points[0]

  for (let i = 1; i < points.length; i++) {
    const p = points[i]
    const dist = Math.sqrt(
      Math.pow(p.x - lastPoint.x, 2) + 
      Math.pow(p.y - lastPoint.y, 2)
    )

    if (dist >= minDistance) {
      simplified.push(p)
      lastPoint = p
    }
  }

  // 确保最后一个点也保留
  if (simplified[simplified.length - 1] !== points[points.length - 1]) {
    simplified.push(points[points.length - 1])
  }

  return simplified
}

/**
 * 完整的轮廓处理流水线
 */
export function processProfile(points) {
  // 1. 先简化
  const simplified = simplifyProfile(points, 1.5)
  
  // 2. 再修复自相交
  const { sanitized, hasIssue, issueRegions } = sanitizeProfile(simplified)

  // 3. 如果修复后点数太少，尝试原始简化版
  if (sanitized.length < 2 && simplified.length >= 2) {
    return {
      sanitized: simplified,
      hasIssue: false,
      issueRegions: []
    }
  }

  return {
    sanitized,
    hasIssue,
    issueRegions
  }
}

/**
 * 检测轮廓是否是有效的（适合生成 3D）
 */
export function isValidProfile(points) {
  if (!points || points.length < 3) {
    return false
  }

  // 检查是否有足够的高度变化
  const ys = points.map(p => p.y)
  const yRange = Math.max(...ys) - Math.min(...ys)
  
  if (yRange < 20) {
    return false // 高度不足 20 个单位
  }

  // 检查是否有正的宽度
  const xs = points.map(p => p.x)
  const maxX = Math.max(...xs)
  
  if (maxX < 5) {
    return false // 最宽处不足 5 个单位
  }

  return true
}
