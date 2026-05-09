import { useStockStore } from '../../store/stockStore'
import { useUserStore } from '../../store/userStore'
import { formatVolume, formatAmount } from '../../utils/chartUtils'

function DataPanel() {
  const { selectedStock } = useStockStore()
  const { isLoggedIn, showAlertModal } = useUserStore()

  if (!selectedStock) return null

  const change = selectedStock.change || 0
  const changePercent = selectedStock.changePercent || 0

  const dataItems = [
    { label: '今开', value: selectedStock.open, format: (v: number) => v.toFixed(2) },
    { label: '最高', value: selectedStock.high, format: (v: number) => v.toFixed(2), isPositive: selectedStock.high >= selectedStock.open },
    { label: '最低', value: selectedStock.low, format: (v: number) => v.toFixed(2), isPositive: selectedStock.low < selectedStock.open },
    { label: '昨收', value: selectedStock.close, format: (v: number) => v.toFixed(2) },
    { label: '成交量', value: selectedStock.volume, format: formatVolume },
    { label: '成交额', value: selectedStock.amount || 0, format: formatAmount },
    { label: '涨跌幅', value: changePercent, format: (v: number) => (v >= 0 ? '+' : '') + v.toFixed(2) + '%', isPositive: changePercent >= 0 },
    { label: '涨跌额', value: change, format: (v: number) => (v >= 0 ? '+' : '') + v.toFixed(2), isPositive: change >= 0 }
  ]

  if (selectedStock.turnoverRate !== undefined) {
    dataItems.push({
      label: '换手率',
      value: selectedStock.turnoverRate,
      format: (v: number) => v.toFixed(2) + '%'
    })
  }

  if (selectedStock.pe !== undefined) {
    dataItems.push({
      label: '市盈率',
      value: selectedStock.pe,
      format: (v: number) => v.toFixed(2)
    })
  }

  if (selectedStock.pb !== undefined) {
    dataItems.push({
      label: '市净率',
      value: selectedStock.pb,
      format: (v: number) => v.toFixed(2)
    })
  }

  return (
    <div className="data-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h4>实时数据</h4>
        {isLoggedIn && (
          <button
            onClick={showAlertModal}
            style={{
              padding: '6px 16px',
              border: '1px solid #ff4d4f',
              borderRadius: 4,
              background: 'white',
              color: '#ff4d4f',
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            设置价格提醒
          </button>
        )}
      </div>
      <div className="data-grid">
        {dataItems.map((item, index) => (
          <div key={index} className="data-item">
            <span className="label">{item.label}</span>
            <span className={`value ${item.isPositive === true ? 'positive' : item.isPositive === false ? 'negative' : ''}`}>
              {item.format(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default DataPanel
