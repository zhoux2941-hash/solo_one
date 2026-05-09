import { useState } from 'react'
import { useUserStore } from '../../store/userStore'
import { authAPI } from '../../services/api'

function LoginModal() {
  const { hideLoginModal, showRegisterModal, login } = useUserStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await authAPI.login(username, password)
      localStorage.setItem('token', response.token)
      login(response.user)
      hideLoginModal()
    } catch (err: any) {
      setError(err.response?.data?.message || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchToRegister = () => {
    hideLoginModal()
    showRegisterModal()
  }

  return (
    <div className="modal-overlay" onClick={hideLoginModal}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>登录</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
            />
          </div>

          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
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
              onClick={handleSwitchToRegister}
            >
              注册账号
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default LoginModal
