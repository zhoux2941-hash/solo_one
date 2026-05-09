import { useStockStore } from '../store/stockStore'
import { useUserStore } from '../store/userStore'
import { useScreenerStore } from '../store/screenerStore'
import SearchBar from '../components/Common/SearchBar'
import Watchlist from '../components/Common/Watchlist'
import KLineChart from '../components/Charts/KLineChart'
import TimeLineChart from '../components/Charts/TimeLineChart'
import DataPanel from '../components/Common/DataPanel'
import LoginModal from '../components/Common/LoginModal'
import RegisterModal from '../components/Common/RegisterModal'
import AlertModal from '../components/Common/AlertModal'
import ScreenerModal from '../components/Common/ScreenerModal'
import ScreenerResults from '../components/Common/ScreenerResults'

function MainPage() {
  const { selectedStock } = useStockStore()
  const {
    user,
    isLoggedIn,
    loginModalVisible,
    registerModalVisible,
    alertModalVisible,
    showLoginModal,
    logout
  } = useUserStore()
  const { openModal } = useScreenerStore()

  return (
    <div className="app">
      <header className="header">
        <h1>实时股票行情分析平台</h1>
        <SearchBar />
        <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={openModal}
            style={{
              padding: '8px 16px',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: 4,
              background: 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontSize: 13
            }}
          >
            🔍 选股
          </button>
          {isLoggedIn ? (
            <>
              <span>{user?.username}</span>
              <button onClick={logout}>退出</button>
            </>
          ) : (
            <button onClick={showLoginModal}>登录</button>
          )}
        </div>
      </header>

      <div className="main-container">
        <aside className="sidebar">
          <Watchlist />
        </aside>

        <main className="content-area">
          {selectedStock ? (
            <>
              <div className="chart-area">
                <KLineChart />
              </div>
              <TimeLineChart />
              <DataPanel />
            </>
          ) : (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" style={{ width: 80, height: 80, marginBottom: 16, opacity: 0.5 }}>
                <path d="M3 3v18h18" strokeWidth="2" />
                <path d="M18 9l-5 5-4-4-3 3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p style={{ marginBottom: 16 }}>请搜索或选择一只股票查看行情</p>
              <button
                onClick={openModal}
                style={{
                  padding: '10px 24px',
                  border: '1px solid #1890ff',
                  borderRadius: 4,
                  background: 'white',
                  color: '#1890ff',
                  cursor: 'pointer',
                  fontSize: 14
                }}
              >
                🔍 使用选股功能
              </button>
            </div>
          )}
        </main>
      </div>

      {loginModalVisible && <LoginModal />}
      {registerModalVisible && <RegisterModal />}
      {alertModalVisible && <AlertModal />}
      <ScreenerModal />
      <ScreenerResults />
    </div>
  )
}

export default MainPage
