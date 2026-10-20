import { create } from 'zustand'
import { persist } from 'zustand/middleware'

/**
 * 로그인 세션. localStorage('mealfit-auth')에 저장되어 새로고침해도 유지된다.
 * user: { id, email, nickname }
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      /** 백엔드 TokenResponse { accessToken, refreshToken, tokenType, expiresIn, user } 저장 */
      setSession: (tokens) =>
        set({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: tokens.user }),
      setUser: (user) => set({ user }),
      clear: () => set({ accessToken: null, refreshToken: null, user: null }),
    }),
    { name: 'mealfit-auth' },
  ),
)

export const useIsAuthenticated = () => useAuthStore((s) => s.accessToken !== null)
