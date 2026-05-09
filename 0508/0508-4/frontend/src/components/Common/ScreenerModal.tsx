import { useState, useEffect } from 'react'
import { useScreenerStore } from '../../store/screenerStore'
import { useUserStore } from '../../store/userStore'
import { screenerAPI } from '../../services/api'
import type { FilterCondition, ScreenStrategy } from '../../types'

function ScreenerModal() {
  const {
    isModalOpen,
    closeModal,
    meta,
    setMeta,
    currentConditions,
    addCondition,
    updateCondition,
    removeCondition,
    clearConditions,
    selectedMarkets,
    setSelectedMarkets,
    strategies,
    setStrategies,
    addStrategy,
    setResults,
    setLoading,
    setError,
    openResults,
    selectedStrategyId,
    setSelectedStrategyId
  } = useScreenerStore()
  
  const { isLoggedIn, showLoginModal } = useUserStore()
  
  const [strategyName, setStrategyName] = useState('')
  const [strategyDescription, setStrategyDescription] = useState('')
  const [showSavePanel, setShowSavePanel] = useState(false)
  const [executing, setExecuting] = useState(false)

  useEffect(() => {
    if (isModalOpen && !meta) {
      loadMeta()
    }
    if (isModalOpen && isLoggedIn) {
      loadStrategies()
    }
  }, [isModalOpen, isLoggedIn])

  const loadMeta = async () => {
    try {
      const data = await screenerAPI.getMeta()
      setMeta(data)
    } catch (err) {
      console.error('Failed to load screener meta:', err)
    }
  }

  const loadStrategies = async () => {
    try {
      const data = await screenerAPI.getStrategies()
      setStrategies(data)
    } catch (err) {
      console.error('Failed to load strategies:', err)
    }
  }

  const handleAddCondition = () => {
    if (!meta || meta.fields.length === 0) return
    
    addCondition({
      field: meta.fields[0].value,
      operator: meta.operators[0].value,
      value: 0
    })
  }

  const handleSelectMarket = (market: string) => {
    if (selectedMarkets.includes(market)) {
      setSelectedMarkets(selectedMarkets.filter(m => m !== market))
    } else {
      setSelectedMarkets([...selectedMarkets, market])
    }
  }

  const handleApplyPreset = (preset: any) => {
    clearConditions()
    setSelectedStrategyId(null)
    preset.conditions.forEach((cond: FilterCondition) => {
      addCondition(cond)
    })
  }

  const handleApplyStrategy = (strategy: ScreenStrategy) => {
    clearConditions()
    setSelectedStrategyId(strategy.id)
    strategy.conditions.forEach((cond: FilterCondition) => {
      addCondition(cond)
    })
  }

  const handleExecute = async () => {
    if (currentConditions.length === 0) {
      setError('请至少添加一个筛选条件')
      return
    }

    setExecuting(true)
    setError(null)
    
    try {
      const results = await screenerAPI.executeScreen(
        currentConditions,
        selectedMarkets,
        50
      )
      setResults(results)
      closeModal()
      openResults()
    } catch (err: any) {
      setError(err.response?.data?.error || '执行选股失败')
    } finally {
      setExecuting(false)
    }
  }

  const handleSaveStrategy = async () => {
    if (!strategyName.trim()) {
      setError('请输入策略名称')
      return
    }
    if (currentConditions.length === 0) {
      setError('请至少添加一个筛选条件')
      return
    }

    setLoading(true)
    try {
      const strategy = await screenerAPI.createStrategy({
        name: strategyName.trim(),
        description: strategyDescription.trim(),
        conditions: currentConditions
      })
      addStrategy(strategy)
      setStrategyName('')
      setStrategyDescription('')
      setShowSavePanel(false)
      setSelectedStrategyId(strategy.id)
    } catch (err: any) {
      setError(err.response?.data?.error || '保存策略失败')
    } finally {
      setLoading(false)
    }
  }

  const getFieldLabel = (field: string) => {
    return meta?.fields.find(f => f.value === field)?.label || field
  }

  const getFieldUnit = (field: string) => {
    return meta?.fields.find(f => f.value === field)?.unit || ''
  }

  const getOperatorLabel = (op: string) => {
    return meta?.operators.find(o => o.value === op)?.label || op
  }

  const needsTwoValues = (op: string) => {
    return meta?.operators.find(o => o.value === op)?.needTwoValues || false
  }

  if (!isModalOpen) return null

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div 
        className="modal" 
        style={{ maxWidth: 800, width: '90%', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3>自定义选股</h3>
          <button
            onClick={closeModal}
            style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#999' }}
          >
            ×
          </button>
        </div>

        {meta && (
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 14, marginBottom: 10, color: '#666' }}>预设策略</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {meta.presets.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyPreset(preset)}
                  style={{
                    padding: '6px 12px',
                    border: '1px solid #d9d9d9',
                    borderRadius: 4,
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: 13
                  }}
                  title={preset.description}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {isLoggedIn && strategies.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ fontSize: 14, marginBottom: 10, color: '#666' }}>我的策略</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {strategies.map((strategy) => (
                <button
                  key={strategy.id}
                  onClick={() => handleApplyStrategy(strategy)}
                  style={{
                    padding: '6px 12px',
                    border: `1px solid ${selectedStrategyId === strategy.id ? '#1890ff' : '#d9d9d9'}`,
                    borderRadius: 4,
                    background: selectedStrategyId === strategy.id ? '#e6f7ff' : 'white',
                    color: selectedStrategyId === strategy.id ? '#1890ff' : '#333',
                    cursor: 'pointer',
                    fontSize: 13
                  }}
                >
                  {strategy.name}
                  {strategy.isDefault && <span style={{ marginLeft: 4, color: '#faad14' }}>★</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: 14, marginBottom: 10, color: '#666' }}>市场范围</h4>
          <div style={{ display: 'flex', gap: 8 }}>
            {meta?.markets.map((market) => (
              <label
                key={market.value}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                  fontSize: 13
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedMarkets.includes(market.value)}
                  onChange={() => handleSelectMarket(market.value)}
                />
                <span>{market.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <h4 style={{ fontSize: 14, color: '#666' }}>筛选条件</h4>
            <button
              onClick={handleAddCondition}
              style={{
                padding: '6px 12px',
                border: '1px solid #1890ff',
                borderRadius: 4,
                background: 'white',
                color: '#1890ff',
                cursor: 'pointer',
                fontSize: 13
              }}
            >
              + 添加条件
            </button>
          </div>

          {currentConditions.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#999', background: '#fafafa', borderRadius: 4 }}>
              暂无筛选条件，点击上方按钮添加
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {currentConditions.map((condition, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: 12,
                    background: '#f5f7fa',
                    borderRadius: 4
                  }}
                >
                  <select
                    value={condition.field}
                    onChange={(e) => updateCondition(index, { ...condition, field: e.target.value })}
                    style={{
                      padding: '8px 10px',
                      border: '1px solid #d9d9d9',
                      borderRadius: 4,
                      fontSize: 14,
                      minWidth: 120
                    }}
                  >
                    {meta?.fields.map((field) => (
                      <option key={field.value} value={field.value}>
                        {field.label}
                      </option>
                    ))}
                  </select>

                  <select
                    value={condition.operator}
                    onChange={(e) => updateCondition(index, { ...condition, operator: e.target.value })}
                    style={{
                      padding: '8px 10px',
                      border: '1px solid #d9d9d9',
                      borderRadius: 4,
                      fontSize: 14,
                      minWidth: 100
                    }}
                  >
                    {meta?.operators.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    step="0.01"
                    value={condition.value}
                    onChange={(e) => updateCondition(index, { 
                      ...condition, 
                      value: parseFloat(e.target.value) || 0 
                    })}
                    placeholder={getFieldUnit(condition.field)}
                    style={{
                      padding: '8px 10px',
                      border: '1px solid #d9d9d9',
                      borderRadius: 4,
                      fontSize: 14,
                      width: 100
                    }}
                  />

                  {needsTwoValues(condition.operator) && (
                    <>
                      <span style={{ color: '#999' }}>-</span>
                      <input
                        type="number"
                        step="0.01"
                        value={condition.value2 || 0}
                        onChange={(e) => updateCondition(index, { 
                          ...condition, 
                          value2: parseFloat(e.target.value) || 0 
                        })}
                        placeholder={getFieldUnit(condition.field)}
                        style={{
                          padding: '8px 10px',
                          border: '1px solid #d9d9d9',
                          borderRadius: 4,
                          fontSize: 14,
                          width: 100
                        }}
                      />
                    </>
                  )}

                  <span style={{ color: '#999', fontSize: 12 }}>
                    {getFieldUnit(condition.field)}
                  </span>

                  <button
                    onClick={() => removeCondition(index)}
                    style={{
                      marginLeft: 'auto',
                      padding: '4px 8px',
                      border: '1px solid #ff4d4f',
                      borderRadius: 4,
                      background: 'white',
                      color: '#ff4d4f',
                      cursor: 'pointer',
                      fontSize: 12
                    }}
                  >
                    删除
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {showSavePanel && (
          <div style={{ marginBottom: 20, padding: 16, background: '#f5f7fa', borderRadius: 4 }}>
            <h4 style={{ fontSize: 14, marginBottom: 12, color: '#666' }}>保存策略</h4>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#666' }}>策略名称</label>
              <input
                type="text"
                value={strategyName}
                onChange={(e) => setStrategyName(e.target.value)}
                placeholder="请输入策略名称"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #d9d9d9',
                  borderRadius: 4,
                  fontSize: 14
                }}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: '#666' }}>描述 (可选)</label>
              <input
                type="text"
                value={strategyDescription}
                onChange={(e) => setStrategyDescription(e.target.value)}
                placeholder="请输入策略描述"
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  border: '1px solid #d9d9d9',
                  borderRadius: 4,
                  fontSize: 14
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleSaveStrategy}
                style={{
                  padding: '8px 16px',
                  border: 'none',
                  borderRadius: 4,
                  background: '#1890ff',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                保存
              </button>
              <button
                onClick={() => setShowSavePanel(false)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #d9d9d9',
                  borderRadius: 4,
                  background: 'white',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                取消
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, borderTop: '1px solid #e8e8e8', paddingTop: 20 }}>
          {isLoggedIn && !showSavePanel && currentConditions.length > 0 && (
            <button
              onClick={() => setShowSavePanel(true)}
              style={{
                padding: '10px 20px',
                border: '1px solid #1890ff',
                borderRadius: 4,
                background: 'white',
                color: '#1890ff',
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              保存策略
            </button>
          )}
          <button
            onClick={closeModal}
            style={{
              padding: '10px 20px',
              border: '1px solid #d9d9d9',
              borderRadius: 4,
              background: 'white',
              color: '#666',
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            取消
          </button>
          <button
            onClick={handleExecute}
            disabled={executing || currentConditions.length === 0}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: 4,
              background: executing || currentConditions.length === 0 ? '#ccc' : '#1890ff',
              color: 'white',
              cursor: executing || currentConditions.length === 0 ? 'not-allowed' : 'pointer',
              fontSize: 14
            }}
          >
            {executing ? '选股中...' : '开始选股'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ScreenerModal
