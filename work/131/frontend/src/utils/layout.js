import * as d3 from 'd3'

const getDynamicLayoutParams = (nodeCount) => {
  if (nodeCount <= 50) {
    return {
      tickCount: 300,
      linkDistance: 150,
      chargeStrength: -300,
      collisionRadius: 60,
      useForceSimulation: true,
    }
  } else if (nodeCount <= 100) {
    return {
      tickCount: 200,
      linkDistance: 180,
      chargeStrength: -400,
      collisionRadius: 70,
      useForceSimulation: true,
    }
  } else if (nodeCount <= 200) {
    return {
      tickCount: 100,
      linkDistance: 200,
      chargeStrength: -500,
      collisionRadius: 80,
      useForceSimulation: true,
    }
  } else {
    return {
      tickCount: 50,
      linkDistance: 250,
      chargeStrength: -800,
      collisionRadius: 100,
      useForceSimulation: false,
    }
  }
}

export const applyForceLayout = (nodes, edges, width = 1000, height = 700, existingPositions = null) => {
  if (!nodes || nodes.length === 0) {
    return []
  }

  const nodeCount = nodes.length
  const params = getDynamicLayoutParams(nodeCount)

  if (!params.useForceSimulation && nodeCount > 200) {
    console.warn(`节点数量过多(${nodeCount})，使用网格布局替代力导向布局`)
    return applyGridLayout(nodes, width, height, existingPositions)
  }

  const existingPosMap = new Map()
  if (existingPositions) {
    existingPositions.forEach((pos) => {
      existingPosMap.set(pos.id, { x: pos.x, y: pos.y })
    })
  }

  const d3Nodes = nodes.map((node, index) => {
    const existingPos = existingPosMap.get(node.id)
    return {
      ...node,
      x: existingPos?.x ?? node.position?.x ?? (Math.random() - 0.5) * width + width / 2,
      y: existingPos?.y ?? node.position?.y ?? (Math.random() - 0.5) * height + height / 2,
      _isNew: !existingPos && !node.position?.x,
    }
  })

  const d3Links = edges.map((edge) => ({
    source: edge.source,
    target: edge.target,
  }))

  const newNodes = d3Nodes.filter((n) => n._isNew)
  const hasNewNodes = newNodes.length > 0

  if (hasNewNodes && existingPositions) {
    const centerX = existingPositions.reduce((sum, p) => sum + p.x, 0) / existingPositions.length
    const centerY = existingPositions.reduce((sum, p) => sum + p.y, 0) / existingPositions.length

    newNodes.forEach((node, idx) => {
      const angle = (idx / newNodes.length) * 2 * Math.PI
      const radius = params.linkDistance * 1.5
      node.x = centerX + Math.cos(angle) * radius
      node.y = centerY + Math.sin(angle) * radius
    })
  }

  const simulation = d3
    .forceSimulation(d3Nodes)
    .force(
      'link',
      d3
        .forceLink(d3Links)
        .id((d) => d.id)
        .distance(params.linkDistance)
        .strength(0.3)
    )
    .force('charge', d3.forceManyBody().strength(params.chargeStrength))
    .force('center', d3.forceCenter(width / 2, height / 2).strength(0.05))
    .force('collision', d3.forceCollide().radius(params.collisionRadius))

  if (existingPositions && hasNewNodes) {
    simulation.force('x', d3.forceX((d) => (d._isNew ? null : d.x)).strength((d) => (d._isNew ? 0 : 0.5)))
    simulation.force('y', d3.forceY((d) => (d._isNew ? null : d.y)).strength((d) => (d._isNew ? 0 : 0.5)))
  }

  simulation.stop()

  for (let i = 0; i < params.tickCount; i++) {
    simulation.tick()
  }

  return d3Nodes.map((node) => ({
    ...node,
    position: {
      x: node.x,
      y: node.y,
    },
  }))
}

export const applyGridLayout = (nodes, width = 1000, height = 700, existingPositions = null) => {
  if (!nodes || nodes.length === 0) {
    return []
  }

  const nodeCount = nodes.length
  const existingPosMap = new Map()

  if (existingPositions) {
    existingPositions.forEach((pos) => {
      existingPosMap.set(pos.id, { x: pos.x, y: pos.y })
    })
  }

  const newNodes = nodes.filter((n) => !existingPosMap.has(n.id) && !n.position?.x)
  const existingNodes = nodes.filter((n) => existingPosMap.has(n.id) || n.position?.x)

  const cols = Math.ceil(Math.sqrt(newNodes.length))
  const spacing = 180

  return nodes.map((node, index) => {
    const existingPos = existingPosMap.get(node.id) || node.position

    if (existingPos?.x !== undefined) {
      return {
        ...node,
        position: {
          x: existingPos.x,
          y: existingPos.y,
        },
      }
    }

    const newIndex = newNodes.indexOf(node)
    if (newIndex === -1) {
      return node
    }

    const startX = existingNodes.length > 0 
      ? (existingPosMap.size > 0 ? Array.from(existingPosMap.values()).reduce((s, p) => s + p.x, 0) / existingPosMap.size : width / 2)
      : width / 2 - ((cols - 1) * spacing) / 2
    
    const startY = existingNodes.length > 0
      ? (existingPosMap.size > 0 ? Array.from(existingPosMap.values()).reduce((s, p) => s + p.y, 0) / existingPosMap.size : height / 2) + spacing
      : height / 2 - (Math.ceil(newNodes.length / cols) - 1) * spacing / 2

    const col = newIndex % cols
    const row = Math.floor(newIndex / cols)

    return {
      ...node,
      position: {
        x: startX + col * spacing,
        y: startY + row * spacing,
      },
    }
  })
}

export const calculateNodePositions = (nodes, edges) => {
  const width = 1200
  const height = 800

  return applyForceLayout(nodes, edges, width, height)
}

export const getLayoutedElements = (nodes, edges, options = {}) => {
  const {
    direction = 'LR',
    nodeWidth = 150,
    nodeHeight = 50,
    nodeSpacing = 80,
    rankSpacing = 100,
    existingPositions = null,
  } = options

  if (nodes.length === 0) {
    return { nodes: [], edges }
  }

  const width = 1200
  const height = 800

  return {
    nodes: applyForceLayout(nodes, edges, width, height, existingPositions),
    edges,
  }
}