import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { useAuthStore } from '@/stores/authStore'
import type { LoginRequest, SignupRequest, TokenResponse } from '@/types/api'

export const authApi = {
  signup: (body: SignupRequest) => api.post<TokenResponse>('/auth/signup', body).then((r) => r.data),
  login: (body: LoginRequest) => api.post<TokenResponse>('/auth/login', body).then((r) => r.data),
  logout: (refreshToken: string) => api.post<void>('/auth/logout', { refreshToken }),
}

/** 로그인/가입 성공 처리: 세션 저장 후 지정한 화면으로 이동 */
function useStartSession() {
  const setSession = useAuthStore((s) => s.setSession)
  const navigate = useNavigate()
  return (tokens: TokenResponse, to: string, state?: unknown) => {
    setSession(tokens)
    navigate(to, { replace: true, state })
  }
}

export function useLogin() {
  const startSession = useStartSession()
  return useMutation({
    mutationFn: ({ email, password }: LoginRequest & { redirectTo: string }) => authApi.login({ email, password }),
    onSuccess: (tokens, { redirectTo }) => startSession(tokens, redirectTo),
  })
}

export function useSignup() {
  const startSession = useStartSession()
  return useMutation({
    mutationFn: authApi.signup,
    // 가입 직후에는 프로필(목표·알레르기)부터 입력하게 한다
    onSuccess: (tokens) => startSession(tokens, '/mypage', { onboarding: true }),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  return async () => {
    const { refreshToken, clear } = useAuthStore.getState()
    if (refreshToken) {
      await authApi.logout(refreshToken).catch(() => undefined)
    }
    clear()
    queryClient.clear()
  }
}
