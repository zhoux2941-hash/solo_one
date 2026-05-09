import { useState } from 'react'
import { useUserStore } from '../../store/userStore'
import { authAPI } from '../../services/api'

function RegisterModal() {
  const { hideRegisterModal, showLoginModal, login } = useUserStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码')
      return
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (password.length < 6) {
      setError('密码长度至少6位')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await authAPI.register(username, password, email || undefined)
      localStorage.setItem('token', response.token)
      login(response.user)
      hideRegisterModal()
    } catch (err: any) {
      setError(err.response?.data?.message || '注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleSwitchToLogin = () => {
    hideRegisterModal()
    showLoginModal()
  }

  return (
    <div className="modal-overlay" onClick={hideRegisterModal}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>注册</h3>
        
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
            <label>邮箱 (可选)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
            />
          </div>

          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码 (至少6位)"
            />
          </div>

          <div className="form-group">
            <label>确认密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次输入密码"
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
              onClick={handleSwitchToLogin}
            >
              已有账号？登录
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? '注册中...' : '注册'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RegisterModal
