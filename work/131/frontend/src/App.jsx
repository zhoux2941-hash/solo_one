import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  MarkerType,
  useReactFlow,
  Handle,
  Position,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { fetchDiseasesBySymptoms, fetchDrugSideEffects, fetchNodeExpand, fetchPath } from './services/api.js'
import CustomNode from './components/CustomNode.jsx'
import { applyForceLayout, applyGridLayout } from './utils/layout.js'

const MAX_NODES_WARNING = 150
const MAX_NODES_LIMIT = 300

const NODE_TYPES = [
  { value: 'Drug', label: '药物' },
  { value: 'Disease', label: '疾病' },
  { value: 'Symptom', label: '症状' },
]

const nodeTypes = {
  custom: CustomNode,
}

const AppContent = () => {
  const reactFlowWrapper = useRef(null)
  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])
  const [symptomInput, setSymptomInput] = useState('')
  const [selectedSymptoms, setSelectedSymptoms] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [loading, setLoading] = useState(false)
  const [nodeCountWarning, setNodeCountWarning] = useState(false)
  const [expandedNodeIds, setExpandedNodeIds] = useState(new Set())
  
  const [pathStartType, setPathStartType] = useState('Drug')
  const [pathStartName, setPathStartName] = useState('')
  const [pathEndType, setPathEndType] = useState('Disease')
  const [pathEndName, setPathEndName] = useState('')
  const [pathNodeIds, setPathNodeIds] = useState(new Set())
  const [pathEdgeIds, setPathEdgeIds] = useState(new Set())
  const [pathNotFound, setPathNotFound] = useState(false)
  
  const { fitView } = useReactFlow()

  const commonSymptoms = [
    '头痛', '发热', '咳嗽', '腹痛', '呕吐',
    '乏力', '失眠', '皮疹', '关节痛', '呼吸困难'
  ]

  const convertToFlowElements = (graphResult, isPathHighlight = false) => {
    const newNodes = graphResult.nodes.map((node, index) => ({
      id: node.id,
      type: 'custom',
      position: { x: index * 150, y: 0 },
      data: {
        label: node.label,
        type: node.type,
        description: node.description,
        details: node.data,
        onExpand: handleNodeExpand,
        isPath: isPathHighlight,
      },
    }))

    const newEdges = graphResult.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      label: edge.label,
      type: 'smoothstep',
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isPathHighlight ? '#ff1744' : '#555',
      },
      style: {
        stroke: isPathHighlight ? '#ff1744' : '#999',
        strokeWidth: isPathHighlight ? 3 : 2,
      },
    }))

    return { nodes: newNodes, edges: newEdges }
  }

  const mergeNodes = useCallback((existingNodes, newNodes) => {
    const existingIds = new Set(existingNodes.map(n => n.id))
    const mergedNodes = [...existingNodes]
    
    newNodes.forEach(node => {
      if (!existingIds.has(node.id)) {
        mergedNodes.push(node)
      }
    })
    
    return mergedNodes
  }, [])

  const mergeEdges = useCallback((existingEdges, newEdges) => {
    const existingIds = new Set(existingEdges.map(e => e.id))
    const mergedEdges = [...existingEdges]
    
    newEdges.forEach(edge => {
      if (!existingIds.has(edge.id)) {
        mergedEdges.push(edge)
      }
    })
    
    return mergedEdges
  }, [])

  const applyPathHighlight = useCallback((graphResult) => {
    const nodeIdSet = new Set(graphResult.nodes.map(n => n.id))
    const edgeIdSet = new Set(graphResult.edges.map(e => e.id))
    
    setPathNodeIds(nodeIdSet)
    setPathEdgeIds(edgeIdSet)
    
    setNodes((prevNodes) => {
      return prevNodes.map((node) => {
        if (nodeIdSet.has(node.id)) {
          return {
            ...node,
            data: {
              ...node.data,
              isPath: true,
            },
          }
        }
        return {
          ...node,
          data: {
            ...node.data,
            isPath: false,
          },
        }
      })
    })
    
    setEdges((prevEdges) => {
      return prevEdges.map((edge) => {
        if (edgeIdSet.has(edge.id)) {
          return {
            ...edge,
            style: {
              ...edge.style,
              stroke: '#ff1744',
              strokeWidth: 3,
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: '#ff1744',
            },
            animated: true,
          }
        }
        return {
          ...edge,
          style: {
            ...edge.style,
            stroke: '#999',
            strokeWidth: 2,
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: '#555',
          },
          animated: false,
        }
      })
    })
  }, [setNodes, setEdges])

  const clearPathHighlight = useCallback(() => {
    setPathNodeIds(new Set())
    setPathEdgeIds(new Set())
    setPathNotFound(false)
    
    setNodes((prevNodes) => {
      return prevNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isPath: false,
        },
      }))
    })
    
    setEdges((prevEdges) => {
      return prevEdges.map((edge) => ({
        ...edge,
        style: {
          ...edge.style,
          stroke: '#999',
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#555',
        },
        animated: false,
      }))
    })
  }, [setNodes, setEdges])

  const handleSearchBySymptoms = useCallback(async () => {
    if (selectedSymptoms.length === 0) {
      alert('请至少选择一个症状')
      return
    }

    clearPathHighlight()
    setLoading(true)
    try {
      const result = await fetchDiseasesBySymptoms(selectedSymptoms)
      const { nodes: newNodes, edges: newEdges } = convertToFlowElements(result)
      
      const layoutedNodes = applyForceLayout(newNodes, newEdges)
      
      setNodes(layoutedNodes)
      setEdges(newEdges)
      
      setTimeout(() => fitView({ padding: 0.2 }), 100)
    } catch (error) {
      console.error('搜索疾病失败:', error)
      alert('搜索失败，请检查后端服务是否启动')
    } finally {
      setLoading(false)
    }
  }, [selectedSymptoms, setNodes, setEdges, fitView, clearPathHighlight])

  const handleSearchDrug = useCallback(async (drugName) => {
    if (!drugName || drugName.trim() === '') {
      return
    }

    clearPathHighlight()
    setLoading(true)
    try {
      const result = await fetchDrugSideEffects(drugName.trim())
      const { nodes: newNodes, edges: newEdges } = convertToFlowElements(result)
      
      const layoutedNodes = applyForceLayout(newNodes, newEdges)
      
      setNodes(layoutedNodes)
      setEdges(newEdges)
      
      setTimeout(() => fitView({ padding: 0.2 }), 100)
    } catch (error) {
      console.error('查询药物失败:', error)
      alert('查询失败，请检查后端服务是否启动')
    } finally {
      setLoading(false)
    }
  }, [setNodes, setEdges, fitView, clearPathHighlight])

  const handleNodeExpand = useCallback(async (nodeData) => {
    const { label, type, onExpand, ...rest } = nodeData
    const nodeId = nodeData.id || `${type}_${label}`
    
    if (expandedNodeIds.has(nodeId)) {
      console.log('该节点已展开，跳过重复展开')
      return
    }

    const projectedTotalNodes = nodes.length + 50
    if (projectedTotalNodes > MAX_NODES_LIMIT) {
      alert(`节点数量已接近上限(${MAX_NODES_LIMIT})，为保证性能，请清空图谱后再展开。`)
      return
    }

    if (projectedTotalNodes > MAX_NODES_WARNING && !nodeCountWarning) {
      setNodeCountWarning(true)
    }
    
    setLoading(true)
    try {
      const result = await fetchNodeExpand(type, label)
      const { nodes: newNodes, edges: newEdges } = convertToFlowElements(result)
      
      const mergedNodes = mergeNodes(nodes, newNodes)
      const mergedEdges = mergeEdges(edges, newEdges)
      
      if (mergedNodes.length > nodes.length) {
        const existingPositions = nodes.map((n) => ({
          id: n.id,
          x: n.position.x,
          y: n.position.y,
        }))
        
        const layoutedNodes = mergedNodes.length > 200
          ? applyGridLayout(mergedNodes, 1200, 800, existingPositions)
          : applyForceLayout(mergedNodes, mergedEdges, 1200, 800, existingPositions)
        
        setNodes(layoutedNodes)
      } else {
        setNodes(mergedNodes)
      }
      
      setEdges(mergedEdges)
      
      setExpandedNodeIds((prev) => new Set([...prev, nodeId]))
      
      setTimeout(() => fitView({ padding: 0.2 }), 100)
    } catch (error) {
      console.error('展开节点失败:', error)
      alert('展开失败，请检查后端服务是否启动')
    } finally {
      setLoading(false)
    }
  }, [nodes, edges, expandedNodeIds, nodeCountWarning, mergeNodes, mergeEdges, setNodes, setEdges, fitView])

  const handleFindPath = useCallback(async () => {
    if (!pathStartName.trim() || !pathEndName.trim()) {
      alert('请输入起始节点和目标节点名称')
      return
    }

    setLoading(true)
    setPathNotFound(false)
    
    try {
      const result = await fetchPath(
        pathStartType,
        pathStartName.trim(),
        pathEndType,
        pathEndName.trim()
      )
      
      if (result.nodes.length === 0) {
        setPathNotFound(true)
        alert(`未找到从"${pathStartName}"到"${pathEndName}"的路径`)
        return
      }
      
      const { nodes: newNodes, edges: newEdges } = convertToFlowElements(result, true)
      
      const currentNodeIds = new Set(nodes.map(n => n.id))
      const hasExistingNodes = newNodes.some(n => currentNodeIds.has(n.id))
      
      if (hasExistingNodes && nodes.length > 0) {
        applyPathHighlight(result)
      } else {
        const mergedNodes = mergeNodes(nodes, newNodes)
        const mergedEdges = mergeEdges(edges, newEdges)
        
        const existingPositions = nodes.length > 0 ? nodes.map((n) => ({
          id: n.id,
          x: n.position.x,
          y: n.position.y,
        })) : null
        
        const layoutedNodes = mergedNodes.length > 200
          ? applyGridLayout(mergedNodes, 1200, 800, existingPositions)
          : applyForceLayout(mergedNodes, mergedEdges, 1200, 800, existingPositions)
        
        setNodes(layoutedNodes)
        setEdges(mergedEdges)
        
        setTimeout(() => {
          applyPathHighlight(result)
          fitView({ padding: 0.2 })
        }, 100)
      }
      
    } catch (error) {
      console.error('查找路径失败:', error)
      alert('查找路径失败，请检查后端服务是否启动')
    } finally {
      setLoading(false)
    }
  }, [pathStartType, pathStartName, pathEndType, pathEndName, nodes, edges, mergeNodes, mergeEdges, applyPathHighlight, setNodes, setEdges, fitView])

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  )

  const onNodeClick = useCallback((_event, node) => {
    setSelectedNode(node.data)
  }, [])

  const addSymptom = useCallback((symptom) => {
    if (!selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms([...selectedSymptoms, symptom])
    }
  }, [selectedSymptoms])

  const removeSymptom = useCallback((symptom) => {
    setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom))
  }, [selectedSymptoms])

  const handleSymptomKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && symptomInput.trim()) {
      addSymptom(symptomInput.trim())
      setSymptomInput('')
    }
  }, [symptomInput, addSymptom])

  const clearGraph = useCallback(() => {
    setNodes([])
    setEdges([])
    setSelectedNode(null)
    setExpandedNodeIds(new Set())
    setNodeCountWarning(false)
    clearPathHighlight()
  }, [setNodes, setEdges, clearPathHighlight])

  const getNodeTypeLabel = (type) => {
    const found = NODE_TYPES.find(t => t.value === type)
    return found ? found.label : type
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>医疗知识图谱查询系统</h1>
      </header>
      
      <div className="main-content">
        <aside className="sidebar">
          <div className="sidebar-section">
            <h3>按症状查询疾病</h3>
            <div>
              <input
                type="text"
                className="search-input"
                placeholder="输入症状，按回车添加"
                value={symptomInput}
                onChange={(e) => setSymptomInput(e.target.value)}
                onKeyPress={handleSymptomKeyPress}
              />
              <div style={{ marginBottom: '10px' }}>
                <small style={{ color: '#666' }}>快速选择：</small>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '5px' }}>
                  {commonSymptoms.map((symptom) => (
                    <button
                      key={symptom}
                      onClick={() => addSymptom(symptom)}
                      style={{
                        padding: '4px 8px',
                        fontSize: '12px',
                        border: '1px solid #ddd',
                        borderRadius: '4px',
                        background: 'white',
                        cursor: 'pointer',
                      }}
                    >
                      {symptom}
                    </button>
                  ))}
                </div>
              </div>
              <div className="symptom-tags">
                {selectedSymptoms.map((symptom) => (
                <span key={symptom} className="symptom-tag">
                  {symptom}
                  <button onClick={() => removeSymptom(symptom)}>×</button>
                </span>
              ))}
              </div>
              <button
                className="search-button"
                onClick={handleSearchBySymptoms}
                disabled={loading || selectedSymptoms.length === 0}
                style={{ marginTop: '15px' }}
              >
                {loading ? '查询中...' : '查询疾病'}
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>查询药物副作用</h3>
            <div>
              <input
                type="text"
                className="search-input"
                placeholder="输入药物名称"
                id="drug-search-input"
              />
              <button
                className="search-button"
                onClick={() => {
                  const input = document.getElementById('drug-search-input')
                  handleSearchDrug(input?.value)
                }}
                disabled={loading}
              >
                {loading ? '查询中...' : '查询药物'}
              </button>
            </div>
          </div>

          <div className="sidebar-section">
            <h3>路径查找</h3>
            <div>
              <div style={{ marginBottom: '10px' }}>
                <small style={{ color: '#666', display: 'block', marginBottom: '5px' }}>起始节点：</small>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={pathStartType}
                    onChange={(e) => setPathStartType(e.target.value)}
                    style={{
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '13px',
                    }}
                  >
                    {NODE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="名称 (如: 阿司匹林)"
                    value={pathStartName}
                    onChange={(e) => setPathStartName(e.target.value)}
                    style={{ marginBottom: '0' }}
                  />
                </div>
              </div>
              
              <div style={{ textAlign: 'center', margin: '5px 0' }}>
                <span style={{ fontSize: '18px' }}>↓</span>
              </div>
              
              <div style={{ marginBottom: '10px' }}>
                <small style={{ color: '#666', display: 'block', marginBottom: '5px' }}>目标节点：</small>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={pathEndType}
                    onChange={(e) => setPathEndType(e.target.value)}
                    style={{
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      fontSize: '13px',
                    }}
                  >
                    {NODE_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    className="search-input"
                    placeholder="名称 (如: 胃溃疡)"
                    value={pathEndName}
                    onChange={(e) => setPathEndName(e.target.value)}
                    style={{ marginBottom: '0' }}
                  />
                </div>
              </div>
              
              {pathNotFound && (
                <div style={{
                  padding: '8px 10px',
                  background: '#ffebee',
                  color: '#c62828',
                  borderRadius: '4px',
                  fontSize: '13px',
                  marginBottom: '10px',
                }}>
                  未找到路径，请检查节点名称是否正确
                </div>
              )}
              
              {pathNodeIds.size > 0 && (
                <div style={{
                  padding: '8px 10px',
                  background: '#e8f5e9',
                  color: '#2e7d32',
                  borderRadius: '4px',
                  fontSize: '13px',
                  marginBottom: '10px',
                }}>
                  已找到路径，节点以红色高亮显示
                </div>
              )}
              
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="search-button"
                  onClick={handleFindPath}
                  disabled={loading || !pathStartName.trim() || !pathEndName.trim()}
                  style={{ flex: 1 }}
                >
                  {loading ? '查找中...' : '查找路径'}
                </button>
                
                {pathNodeIds.size > 0 && (
                  <button
                    onClick={clearPathHighlight}
                    style={{
                      padding: '10px 15px',
                      background: '#757575',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    清除高亮
                  </button>
                )}
              </div>
            </div>
          </div>

          {selectedNode && (
            <div className="sidebar-section">
              <h3>节点详情</h3>
              <div className="node-details">
                <h4>{selectedNode.label}</h4>
                <p><strong>类型：</strong>{getNodeTypeLabel(selectedNode.type) || selectedNode.type}</p>
                {selectedNode.description && <p><strong>描述：</strong>{selectedNode.description}</p>}
                {selectedNode.details && Object.entries(selectedNode.details).map(([key, value]) => (
                  <div key={key} className="detail-item">
                    <span className="detail-label">{key}：</span>
                    <div className="detail-value">
                      {Array.isArray(value) ? value.join(', ') : String(value)}
                    </div>
                  </div>
                ))}
                <button
                  className="search-button"
                  onClick={() => handleNodeExpand(selectedNode)}
                  disabled={loading}
                  style={{ marginTop: '15px' }}
                >
                  {loading ? '展开中...' : '展开关联节点'}
                </button>
              </div>
            </div>
          )}

          <div className="sidebar-section">
            <button
              className="search-button"
              onClick={clearGraph}
              style={{ background: '#f44336' }}
            >
              清空图谱
            </button>
          </div>
        </aside>

        <div className="graph-container" ref={reactFlowWrapper}>
          {loading && (
            <div className="loading">
              <p>加载中...</p>
            </div>
          )}
          
          {!loading && nodes.length === 0 && (
            <div className="empty-state">
              <h3>医疗知识图谱查询系统</h3>
              <p>选择症状查询相关疾病，或输入药物名称查询其副作用</p>
              <p style={{ marginTop: '10px' }}>使用"路径查找"功能查询两个节点之间的因果链条</p>
              <p style={{ marginTop: '10px', fontSize: '13px', color: '#999' }}>
                示例：查找"阿司匹林"到"胃溃疡"的路径
              </p>
            </div>
          )}
          
          {nodeCountWarning && (
            <div
              style={{
                position: 'absolute',
                top: 10,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 1000,
                background: '#fff3cd',
                color: '#856404',
                padding: '10px 20px',
                borderRadius: 6,
                fontSize: 14,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              ⚠️ 当前节点数量较多({nodes.length})，可能影响性能。建议清空图谱后继续使用。
              <button
                onClick={() => setNodeCountWarning(false)}
                style={{
                  marginLeft: 15,
                  background: 'none',
                  border: 'none',
                  color: '#856404',
                  cursor: 'pointer',
                  fontSize: 16,
                }}
              >
                ×
              </button>
            </div>
          )}
          
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            panOnDrag={true}
            panOnScroll={true}
            zoomOnScroll={true}
            zoomOnPinch={true}
            nodesDraggable={true}
            nodesConnectable={false}
            elementsSelectable={true}
            preventScrolling={false}
            attributionPosition="bottom-right"
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#ddd" />
            <Controls />
            <MiniMap
              nodeStrokeColor={(n) => {
                if (n.data?.isPath) return '#ff1744'
                if (n.data?.type === 'Disease') return '#1976d2'
                if (n.data?.type === 'Symptom') return '#f57c00'
                if (n.data?.type === 'Drug') return '#388e3c'
                return '#c2185b'
              }}
              nodeColor={(n) => {
                if (n.data?.isPath) return '#ffebee'
                if (n.data?.type === 'Disease') return '#e3f2fd'
                if (n.data?.type === 'Symptom') return '#fff3e0'
                if (n.data?.type === 'Drug') return '#e8f5e9'
                return '#fce4ec'
              }}
            />
          </ReactFlow>

          <div className="legend">
            <h4>图例</h4>
            <div className="legend-item">
              <div className="legend-color legend-disease"></div>
              <span>疾病 (Disease)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color legend-symptom"></div>
              <span>症状 (Symptom)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color legend-drug"></div>
              <span>药物 (Drug)</span>
            </div>
            <div className="legend-item">
              <div className="legend-color legend-sideeffect"></div>
              <span>副作用 (SideEffect)</span>
            </div>
            {pathNodeIds.size > 0 && (
              <div className="legend-item" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #eee' }}>
                <div style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  background: '#ffebee',
                  border: '2px solid #ff1744',
                }}></div>
                <span style={{ color: '#c62828' }}>路径节点</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const App = () => (
  <ReactFlowProvider>
    <AppContent />
  </ReactFlowProvider>
)

export default App
