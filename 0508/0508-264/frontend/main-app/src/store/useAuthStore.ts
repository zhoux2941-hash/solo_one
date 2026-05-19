import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number
  tenantId: number
  username: string
  realName: string
}

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  login: (data: { token: string; userId: number; tenantId: number; username: string; realName: string }) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      login: (data) =>
        set({
          token: data.token,
          user: {
            id: data.userId,
            tenantId: data.tenantId,
            username: data.username,
            realName: data.realName,
          },
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
