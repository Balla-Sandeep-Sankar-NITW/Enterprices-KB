import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '@/api/client'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const res = await authApi.login({ email, password })
          const { access_token, refresh_token } = res.data
          localStorage.setItem('access_token', access_token)
          localStorage.setItem('refresh_token', refresh_token)

          // Fetch user profile
          const meRes = await authApi.me()
          set({
            user: meRes.data,
            accessToken: access_token,
            refreshToken: refresh_token,
            isLoading: false
          })
          return { success: true }
        } catch (err) {
          set({ isLoading: false })
          return { success: false, error: err.response?.data?.detail || 'Login failed' }
        }
      },

      logout: () => {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        set({ user: null, accessToken: null, refreshToken: null })
      },

      loadUser: async () => {
        const token = localStorage.getItem('access_token')
        if (!token) return

        try {
          const res = await authApi.me()
          set({ user: res.data })
        } catch {
          localStorage.removeItem('access_token')
          localStorage.removeItem('refresh_token')
          set({ user: null })
        }
      },

      isAdmin: () => get().user?.role === 'admin',
      isActive: () => get().user?.status === 'active',
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ user: state.user }),
    }
  )
)

export default useAuthStore
