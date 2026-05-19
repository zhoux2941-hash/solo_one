import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/api/axios'
import { message } from 'antd'

interface PermissionState {
  // 用户权限码列表
  permissions: string[]
  // 权限版本号，用于检测权限变更
  permissionVersion: number
  // 最后一次检查时间
  lastCheckTime: number
  // 是否正在刷新权限
  isRefreshing: boolean
  // WebSocket连接状态
  wsConnected: boolean

  // 方法
  setPermissions: (permissions: string[]) => void
  setPermissionVersion: (version: number) => void
  refreshPermissions: () => Promise<void>
  checkPermissionVersion: () => Promise<boolean>
  hasPermission: (code: string) => boolean
  hasAnyPermission: (codes: string[]) => boolean
  hasAllPermissions: (codes: string[]) => boolean
  setWsConnected: (connected: boolean) => void
  clearPermissions: () => void
}

/**
 * 权限状态管理Store
 * 解决权限缓存不一致问题：
 * 1. 定期检查权限版本号
 * 2. 监听WebSocket权限变更事件
 * 3. 自动刷新权限缓存
 */
export const usePermissionStore = create<PermissionState>()(
  persist(
    (set, get) => ({
      permissions: [],
      permissionVersion: 0,
      lastCheckTime: 0,
      isRefreshing: false,
      wsConnected: false,

      setPermissions: (permissions) => set({ permissions }),

      setPermissionVersion: (version) => set({ permissionVersion: version }),

      setWsConnected: (connected) => set({ wsConnected: connected }),

      /**
       * 刷新当前用户的权限
       * 调用后端API获取最新权限列表并更新版本
       */
      refreshPermissions: async () => {
        if (get().isRefreshing) return

        set({ isRefreshing: true })
        try {
          const response = await api.post('/permissions/refresh')
          const { permissions, permissionVersion } = response.data

          set({
            permissions,
            permissionVersion,
            lastCheckTime: Date.now(),
          })

          console.log(`权限已刷新，版本: ${permissionVersion}，权限数量: ${permissions.length}`)
        } catch (error) {
          console.error('刷新权限失败:', error)
        } finally {
          set({ isRefreshing: false })
        }
      },

      /**
       * 检查权限版本是否需要更新
       * @returns 是否需要刷新权限
       */
      checkPermissionVersion: async () => {
        const currentVersion = get().permissionVersion

        try {
          const response = await api.get('/permissions/check-version', {
            params: { clientVersion: currentVersion },
          })

          const { serverVersion, needRefresh } = response.data

          if (needRefresh) {
            message.info('检测到权限变更，正在刷新...')
            await get().refreshPermissions()
            return true
          }

          set({ lastCheckTime: Date.now() })
          return false
        } catch (error) {
          console.error('检查权限版本失败:', error)
          return false
        }
      },

      /**
       * 检查是否拥有指定权限
       */
      hasPermission: (code) => {
        return get().permissions.includes(code)
      },

      /**
       * 检查是否拥有任意一个权限
       */
      hasAnyPermission: (codes) => {
        return codes.some(code => get().permissions.includes(code))
      },

      /**
       * 检查是否拥有所有指定权限
       */
      hasAllPermissions: (codes) => {
        return codes.every(code => get().permissions.includes(code))
      },

      clearPermissions: () => set({
        permissions: [],
        permissionVersion: 0,
        lastCheckTime: 0,
      }),
    }),
    {
      name: 'permission-storage',
    }
  )
)

/**
 * WebSocket权限监听Hook
 * 在应用初始化时调用，实时监听权限变更事件
 */
let wsClient: any = null

export const setupPermissionWebSocket = (tenantId: number, userId: number) => {
  // 模拟WebSocket连接（实际项目中使用stompjs）
  console.log(`设置权限WebSocket监听, tenantId: ${tenantId}, userId: ${userId}`)

  // 权限刷新轮询（作为WebSocket的降级方案）
  const pollingInterval = setInterval(async () => {
    const { checkPermissionVersion } = usePermissionStore.getState()
    await checkPermissionVersion()
  }, 60000) // 每分钟检查一次

  // 模拟接收权限变更事件
  const simulatePermissionChange = () => {
    // 实际项目中这里是WebSocket消息处理
    console.log('监听权限变更事件...')
  }

  return () => {
    clearInterval(pollingInterval)
    if (wsClient) {
      wsClient.disconnect()
    }
  }
}

/**
 * 权限指令组件
 * 使用方式:
 * <PermissionGuard code="user:create">
 *   <Button>创建用户</Button>
 * </PermissionGuard>
 */
export const PermissionGuard = ({
  code,
  children,
  fallback = null,
}: {
  code: string
  children: React.ReactNode
  fallback?: React.ReactNode
}) => {
  const hasPermission = usePermissionStore(state => state.hasPermission(code))
  return hasPermission ? <>{children}</> : <>{fallback}</>
}
