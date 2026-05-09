import { useScreenerStore } from '../../store/screenerStore'
import { useStockStore } from '../../store/stockStore'
import { useUserStore } from '../../store/userStore'
import { watchlistAPI } from '../../services/api'

function ScreenerResults() {
  const {
    isResultsOpen,
    closeResults,
    results,
    currentConditions,
    selectedMarkets,
    meta,
    openModal
  } = useScreenerStore()
  
  const { setSelectedStock } = useStockStore()
  const { watchlist, addStockToGroup, isLoggedIn, showLoginModal } = useUserStore()

  const getFieldLabel = (field: string) => {
    return meta?.fields.find(f => f.value === field)?.label || field
  }

  const getMarketLabel = (market: string) => {
    return meta?.markets.find(m => m.value === market)?.label || market
  }

  const handleSelectStock = (result: any) => {
    setSelectedStock(result.stock)
    closeResults()
  }

  const handleAddToWatchlist = async (result: any, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!isLoggedIn) {
      showLoginModal()
      return
    }

    if (watchlist.length === 0) {
      alert('请先创建自选股分组')
      return
    }

    try {
      await watchlistAPI.addStock(watchlist[0].id, result.stock.code)
      addStockToGroup(watchlist[0].id, result.stock)
      alert('已添加到自选股')
    } catch (err: any) {
      alert(err.response?.data?.error || '添加失败')
    }
  }

  const renderConditionsSummary = () => {
    if (currentConditions.length === 0) return null

    return (
      <div style={{ marginBottom: 16, padding: 12, background: '#f5f7fa', borderRadius: 4 }}>
        <div style={{ fontSize: 13, color: '#666', marginBottom: 8 }}>
          市场范围: {selectedMarkets.map(m => getMarketLabel(m)).join(', ')}
        </div>
        <div style={{ fontSize: 13, color: '#666' }}>
          筛选条件: {currentConditions.map((cond, idx) => (
            <span key={idx}>
              {idx > 0 && ' 且 '}
              <span style={{ color: '#1890ff' }}>{getFieldLabel(cond.field)}</span>
              {' '}
              {meta?.operators.find(o => o.value === cond.operator)?.label || cond.operator}
              {' '}
              <span style={{ fontWeight: 600 }}>{cond.value}</span>
              {cond.operator === 'between' && cond.value2 !== undefined && (
                <> - <span style={{ fontWeight: 600 }}>{cond.value2}</span></>
              )}
            </span>
          ))}
        </div>
      </div>
    )
  }

  if (!isResultsOpen) return null

  return (
    <div className="modal-overlay" onClick={closeResults}>
      <div 
        className="modal" 
        style={{ maxWidth: 900, width: '90%', maxHeight: '85vh', overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3>
            选股结果
            <span style={{ 
              marginLeft: 12, 
              fontSize: 14, 
              fontWeight: 'normal', 
              color: '#666' 
            }}>
              共 {results.length} 只股票
            </span>
          </h3>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={() => {
                closeResults()
                openModal()
              }}
              style={{
                padding: '8px 16px',
                border: '1px solid #1890ff',
                borderRadius: 4,
                background: 'white',
                color: '#1890ff',
                cursor: 'pointer',
                fontSize: 14
              }}
            >
              修改条件
            </button>
            <button
              onClick={closeResults}
              style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#999' }}
            >
              ×
            </button>
          </div>
        </div>

        {renderConditionsSummary()}

        {results.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center', color: '#999' }}>
            <p>没有找到符合条件的股票</p>
            <p style={{ marginTop: 8, fontSize: 13 }}>请尝试调整筛选条件</p>
          </div>
        ) : (
          <div style={{ maxHeight: 'calc(85vh - 200px)', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#fafafa' }}>
                  <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #e8e8e8', fontSize: 13, fontWeight: 500, color: '#666' }}>
                    股票
                  </th>
                  <th style={{ padding: 12, textAlign: 'right', borderBottom: '1px solid #e8e8e8', fontSize: 13, fontWeight: 500, color: '#666' }}>
                    最新价
                  </th>
                  <th style={{ padding: 12, textAlign: 'right', borderBottom: '1px solid #e8e8e8', fontSize: 13, fontWeight: 500, color: '#666' }}>
                    涨跌幅
                  </th>
                  <th style={{ padding: 12, textAlign: 'right', borderBottom: '1px solid #e8e8e8', fontSize: 13, fontWeight: 500, color: '#666' }}>
                    PE
                  </th>
                  <th style={{ padding: 12, textAlign: 'right', borderBottom: '1px solid #e8e8e8', fontSize: 13, fontWeight: 500, color: '#666' }}>
                    PB
                  </th>
                  <th style={{ padding: 12, textAlign: 'center', borderBottom: '1px solid #e8e8e8', fontSize: 13, fontWeight: 500, color: '#666' }}>
                    操作
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, index) => {
                  const stock = result.stock
                  const isUp = (stock.changePercent || 0) >= 0
                  
                  return (
                    <tr 
                      key={stock.code}
                      style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLElement).style.background = '#f5f7fa'
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'white'
                      }}
                      onClick={() => handleSelectStock(result)}
                    >
                      <td style={{ padding: 12, borderBottom: '1px solid #f0f0f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: '#999', fontSize: 12, minWidth: 24 }}>
                            {index + 1}
                          </span>
                          <div>
                            <div style={{ fontWeight: 500 }}>{stock.name}</div>
                            <div style={{ fontSize: 12, color: '#999' }}>
                              {stock.code}
                              <span 
                                className={`market-tag ${stock.market}`}
                                style={{ marginLeft: 6, fontSize: 11 }}
                              >
                                {stock.market.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: 12, textAlign: 'right', borderBottom: '1px solid #f0f0f0', fontWeight: 600 }}>
                        <span style={{ color: isUp ? '#f5222d' : '#52c41a' }}>
                          {stock.price.toFixed(2)}
                        </span>
                      </td>
                      <td style={{ padding: 12, textAlign: 'right', borderBottom: '1px solid #f0f0f0' }}>
                        <span style={{ color: isUp ? '#f5222d' : '#52c41a' }}>
                          {isUp ? '+' : ''}{(stock.changePercent || 0).toFixed(2)}%
                        </span>
                      </td>
                      <td style={{ padding: 12, textAlign: 'right', borderBottom: '1px solid #f0f0f0', color: '#666' }}>
                        {stock.pe !== undefined ? stock.pe.toFixed(2) : '-'}
                      </td>
                      <td style={{ padding: 12, textAlign: 'right', borderBottom: '1px solid #f0f0f0', color: '#666' }}>
                        {stock.pb !== undefined ? stock.pb.toFixed(2) : '-'}
                      </td>
                      <td style={{ padding: 12, textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                        <button
                          onClick={(e) => handleAddToWatchlist(result, e)}
                          style={{
                            padding: '4px 10px',
                            border: '1px solid #1890ff',
                            borderRadius: 4,
                            background: 'white',
                            color: '#1890ff',
                            cursor: 'pointer',
                            fontSize: 12
                          }}
                        >
                          + 自选
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ScreenerResults
