import { useState } from 'react'
import { useUserStore } from '../../store/userStore'
import { useStockStore } from '../../store/stockStore'
import { alertAPI } from '../../services/api'

function AlertModal() {
  const { hideAlertModal, addPriceAlert, priceAlerts, removePriceAlert } = useUserStore()
  const { selectedStock } = useStockStore()
  const [targetPrice, setTargetPrice] = useState('')
  const [alertType, setAlertType] = useState<'above' | 'below'>('above')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedStock) {
      setError('请先选择股票')
      return
    }

    const price = parseFloat(targetPrice)
    if (isNaN(price) || price <= 0) {
      setError('请输入有效的价格')
      return
    }

    setLoading(true)
    setError('')

    try {
      const alert = await alertAPI.createAlert({
        stockCode: selectedStock.code,
        targetPrice: price,
        type: alertType
      })
      addPriceAlert(alert)
      setTargetPrice('')
    } catch (err: any) {
      setError(err.response?.data?.message || '创建提醒失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (alertId: number) => {
    try {
      await alertAPI.deleteAlert(alertId)
      removePriceAlert(alertId)
    } catch (err) {
      console.error('Failed to delete alert:', err)
    }
  }

  const stockAlerts = priceAlerts.filter(
    alert => selectedStock && alert.stockCode === selectedStock.code
  )

  return (
    <div className="modal-overlay" onClick={hideAlertModal}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>价格提醒</h3>

        {selectedStock ? (
          <>
            <div style={{ marginBottom: 16, padding: 12, background: '#f5f7fa', borderRadius: 4 }}>
              <div style={{ fontWeight: 500 }}>{selectedStock.name}</div>
              <div style={{ fontSize: 12, color: '#999' }}>
                当前价格: <span style={{ fontWeight: 600, color: (selectedStock.change || 0) >= 0 ? '#f5222d' : '#52c41a' }}>
                  {selectedStock.price.toFixed(2)}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>提醒类型</label>
                <select
                  value={alertType}
                  onChange={(e) => setAlertType(e.target.value as 'above' | 'below')}
                >
                  <option value="above">价格高于</option>
                  <option value="below">价格低于</option>
                </select>
              </div>

              <div className="form-group">
                <label>目标价格</label>
                <input
                  type="number"
                  step="0.01"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="请输入目标价格"
                />
              </div>

              {error && (
                <div style={{ color: '#ff4d4f', fontSize: 12, marginBottom: 12 }}>
                  {error}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={hideAlertModal}
                >
                  关闭
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={loading}
                >
                  {loading ? '创建中...' : '创建提醒'}
                </button>
              </div>
            </form>

            {stockAlerts.length > 0 && (
              <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid #e8e8e8' }}>
                <h4 style={{ marginBottom: 12, fontSize: 14 }}>已有提醒</h4>
                {stockAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: 8,
                      background: '#fafafa',
                      borderRadius: 4,
                      marginBottom: 8
                    }}
                  >
                    <div>
                      <span style={{ marginRight: 8 }}>
                        {alert.type === 'above' ? '↑ 高于' : '↓ 低于'}
                      </span>
                      <span style={{ fontWeight: 600 }}>{alert.targetPrice.toFixed(2)}</span>
                      {alert.isTriggered && (
                        <span style={{ marginLeft: 8, color: '#faad14', fontSize: 12 }}>
                          已触发
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      style={{
                        padding: '4px 8px',
                        fontSize: 12,
                        color: '#ff4d4f',
                        border: '1px solid #ff4d4f',
                        background: 'white',
                        borderRadius: 4,
                        cursor: 'pointer'
                      }}
                      onClick={() => handleDelete(alert.id)}
                    >
                      删除
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
            请先选择一只股票
          </div>
        )}
      </div>
    </div>
  )
}

export default AlertModal
