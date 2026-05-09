import { useState, useEffect } from 'react'
import { useUserStore } from '../../store/userStore'
import { useStockStore } from '../../store/stockStore'
import { useWebSocketStore } from '../../store/websocketStore'
import { watchlistAPI, stockAPI } from '../../services/api'
import { subscribeStock } from '../../services/websocketService'
import type { Stock, WatchlistGroup } from '../../types'

interface WatchlistItemProps {
  stock: Stock
  isSelected: boolean
  onClick: () => void
}

function WatchlistItem({ stock, isSelected, onClick }: WatchlistItemProps) {
  const { stockPrices } = useWebSocketStore()
  const liveStock = stockPrices[stock.code] || stock

  const change = liveStock.change || 0
  const changePercent = liveStock.changePercent || 0

  return (
    <div
      className={`stock-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="stock-name">
        {liveStock.name}
        <span className={`market-tag ${stock.market}`}>{stock.market.toUpperCase()}</span>
      </div>
      <div style={{ marginTop: 6 }}>
        <span className="stock-price" style={{
          color: change >= 0 ? '#f5222d' : '#52c41a'
        }}>
          {liveStock.price.toFixed(2)}
        </span>
        <span className={`stock-change ${change >= 0 ? 'positive' : 'negative'}`}>
          {change >= 0 ? '+' : ''}{change.toFixed(2)}
          ({changePercent >= 0 ? '+' : ''}{changePercent.toFixed(2)}%)
        </span>
      </div>
    </div>
  )
}

interface GroupSectionProps {
  group: WatchlistGroup
  isExpanded: boolean
  onToggle: () => void
  selectedCode: string | null
  onSelectStock: (stock: Stock) => void
}

function GroupSection({ group, isExpanded, onToggle, selectedCode, onSelectStock }: GroupSectionProps) {
  return (
    <div>
      <div className="group-title" onClick={onToggle}>
        <span>{group.name} ({group.stocks.length})</span>
        <span>{isExpanded ? '▼' : '▶'}</span>
      </div>
      {isExpanded && (
        <div>
          {group.stocks.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#999', fontSize: 13 }}>
              暂无股票
            </div>
          ) : (
            group.stocks.map((stock) => (
              <WatchlistItem
                key={stock.code}
                stock={stock}
                isSelected={selectedCode === stock.code}
                onClick={() => onSelectStock(stock)}
              />
            ))
          )}
        </div>
      )}
    </div>
  )
}

function Watchlist() {
  const {
    isLoggedIn,
    watchlist,
    setWatchlist,
    showGroupModal,
    showLoginModal
  } = useUserStore()
  const { selectedStock, setSelectedStock } = useStockStore()
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({})

  useEffect(() => {
    if (isLoggedIn) {
      loadWatchlist()
    }
  }, [isLoggedIn])

  useEffect(() => {
    if (watchlist.length > 0) {
      const allCodes = watchlist.flatMap(g => g.stocks.map(s => s.code))
      if (allCodes.length > 0) {
        subscribeStock(allCodes)
        updateWatchlistPrices(allCodes)
      }
    }
  }, [watchlist])

  const loadWatchlist = async () => {
    try {
      const groups = await watchlistAPI.getGroups()
      setWatchlist(groups)
      if (groups.length > 0) {
        setExpandedGroups({ [groups[0].id]: true })
      }
    } catch (error) {
      console.error('Failed to load watchlist:', error)
    }
  }

  const updateWatchlistPrices = async (codes: string[]) => {
    try {
      const updatedGroups = await Promise.all(
        watchlist.map(async (group) => {
          const updatedStocks = await Promise.all(
            group.stocks.map(async (stock) => {
              try {
                const realtime = await stockAPI.getRealTime(stock.code)
                return { ...stock, ...realtime }
              } catch {
                return stock
              }
            })
          )
          return { ...group, stocks: updatedStocks }
        })
      )
      setWatchlist(updatedGroups)
    } catch (error) {
      console.error('Failed to update prices:', error)
    }
  }

  const toggleGroup = (groupId: number) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
    }))
  }

  const handleSelectStock = (stock: Stock) => {
    setSelectedStock(stock)
  }

  return (
    <>
      <div className="sidebar-header">
        <h3>自选股</h3>
        <button onClick={isLoggedIn ? showGroupModal : showLoginModal}>
          + 分组
        </button>
      </div>

      <div className="watchlist">
        {!isLoggedIn ? (
          <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
            <p style={{ marginBottom: 8 }}>登录后可查看自选股</p>
            <button
              style={{
                padding: '8px 20px',
                border: '1px solid #1890ff',
                borderRadius: 4,
                background: 'white',
                color: '#1890ff',
                cursor: 'pointer'
              }}
              onClick={showLoginModal}
            >
              立即登录
            </button>
          </div>
        ) : watchlist.length === 0 ? (
          <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
            <p>暂无自选分组</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>点击上方按钮创建</p>
          </div>
        ) : (
          watchlist.map((group) => (
            <GroupSection
              key={group.id}
              group={group}
              isExpanded={expandedGroups[group.id] ?? true}
              onToggle={() => toggleGroup(group.id)}
              selectedCode={selectedStock?.code || null}
              onSelectStock={handleSelectStock}
            />
          ))
        )}
      </div>
    </>
  )
}

export default Watchlist
