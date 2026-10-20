import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Me, TokenResponse } from '@/types/api'

interface AuthState {
  accessToken: string | null
  refreshToken: string | null
  user: Me | null
  setSession: (tokens: TokenResponse) => void
  setUser: (user: Me) => void
  clear: () => void
}

/** 로그인 세션. localStorage('mealfit-auth')에 저장되어 새로고침해도 유지된다. */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      setSession: (tokens) =>
        set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: tokens.user }),
      setUser: (user) => set({ user }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: 'mealfit-auth' },
  ),
)

export const useIsAuthenticated = () => useAuthStore((s) => s.accessToken !== null)
