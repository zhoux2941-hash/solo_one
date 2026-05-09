import { useState, useEffect, useRef } from 'react'
import { useStockStore } from '../../store/stockStore'
import { useUserStore } from '../../store/userStore'
import { stockAPI, watchlistAPI } from '../../services/api'
import type { Stock } from '../../types'

interface SearchResultDropdownProps {
  results: Stock[]
  onSelect: (stock: Stock) => void
  onAddToWatchlist: (stock: Stock) => void
  isLoggedIn: boolean
}

function SearchResultDropdown({ results, onSelect, onAddToWatchlist, isLoggedIn }: SearchResultDropdownProps) {
  if (results.length === 0) return null

  return (
    <div style={{
      position: 'absolute',
      top: '100%',
      left: 0,
      right: 0,
      background: 'white',
      borderRadius: 8,
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
      maxHeight: 300,
      overflowY: 'auto',
      zIndex: 100,
      marginTop: 4
    }}>
      {results.map((stock) => (
        <div
          key={stock.code}
          style={{
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = '#f5f7fa'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'white'
          }}
          onClick={() => onSelect(stock)}
        >
          <div>
            <div style={{ fontWeight: 500, color: '#333' }}>{stock.name}</div>
            <div style={{ fontSize: 12, color: '#999' }}>{stock.code}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              fontWeight: 600,
              color: stock.change >= 0 ? '#f5222d' : '#52c41a'
            }}>
              {stock.price.toFixed(2)}
            </span>
            <span style={{
              fontSize: 13,
              color: stock.change >= 0 ? '#f5222d' : '#52c41a'
            }}>
              {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
            </span>
            {isLoggedIn && (
              <button
                style={{
                  padding: '4px 8px',
                  fontSize: 12,
                  border: '1px solid #1890ff',
                  borderRadius: 4,
                  background: 'white',
                  color: '#1890ff',
                  cursor: 'pointer'
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  onAddToWatchlist(stock)
                }}
              >
                + 自选
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

function SearchBar() {
  const [keyword, setKeyword] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const { searchResults, setSearchResults, setSelectedStock } = useStockStore()
  const { isLoggedIn, watchlist, addStockToGroup } = useUserStore()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (keyword.trim().length >= 2) {
        try {
          const results = await stockAPI.search(keyword)
          setSearchResults(results)
          setShowDropdown(true)
        } catch (error) {
          console.error('Search failed:', error)
        }
      } else {
        setSearchResults([])
        setShowDropdown(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [keyword, setSearchResults])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectStock = (stock: Stock) => {
    setSelectedStock(stock)
    setShowDropdown(false)
    setKeyword('')
  }

  const handleAddToWatchlist = async (stock: Stock) => {
    if (watchlist.length > 0) {
      const defaultGroupId = watchlist[0].id
      await watchlistAPI.addStock(defaultGroupId, stock.code)
      addStockToGroup(defaultGroupId, stock)
    }
  }

  return (
    <div className="search-bar" style={{ position: 'relative' }} ref={dropdownRef}>
      <input
        type="text"
        placeholder="搜索股票代码或名称..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onFocus={() => keyword.length >= 2 && setShowDropdown(true)}
      />
      <button>搜索</button>
      {showDropdown && (
        <SearchResultDropdown
          results={searchResults}
          onSelect={handleSelectStock}
          onAddToWatchlist={handleAddToWatchlist}
          isLoggedIn={isLoggedIn}
        />
      )}
    </div>
  )
}

export default SearchBar
