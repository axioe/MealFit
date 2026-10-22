import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { useAuthStore } from '@/stores/authStore'

/** 인증 요청도 기존 공통 Axios 인스턴스만 사용합니다. */
export const authApi = {
  signup: (body) =>
    api.post('/auth/signup', body).then((response) => response.data),

  login: (body) =>
    api.post('/auth/login', body).then((response) => response.data),

  getMe: () =>
    api.get('/me').then((response) => response.data),

  logout: (refreshToken) =>
    api.post('/auth/logout', { refreshToken }),
}

/**
 * 가입·로그인 성공 시 이전 회원의 캐시를 비우고
 * 서버에서 받은 새 로그인 정보를 저장합니다.
 */
function useSessionMutation(mutationFn) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,

    // 인증 요청은 자동 반복하지 않습니다.
    retry: false,

    onSuccess: async (session) => {
      await queryClient.cancelQueries()
      queryClient.clear()
      useAuthStore.getState().setSession(session)
    },
  })
}

/** 회원가입 성공 후 자동 로그인 상태를 저장합니다. */
export function useSignup() {
  return useSessionMutation(authApi.signup)
}

/** 이메일 로그인 성공 후 토큰과 회원 정보를 저장합니다. */
export function useLogin() {
  return useSessionMutation(authApi.login)
}

/**
 * 서버에서 Refresh Token을 폐기한 뒤 로컬 상태를 정리합니다.
 * 서버 요청이 실패해도 이 브라우저의 로그인 정보는 제거합니다.
 */
export function useLogout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    retry: false,

    mutationFn: async () => {
      const refreshToken = useAuthStore.getState().refreshToken

      if (refreshToken) {
        await authApi.logout(refreshToken)
      }
    },

    onSettled: async () => {
      try {
        // 먼저 공개 화면으로 이동해야 보호 라우트가 로그아웃한 화면을
        // 다음 로그인 복귀 경로(from)로 저장하지 않습니다.
        // 버튼이 사라져도 실행되도록 화면 콜백이 아닌 공통 훅에서 처리합니다.
        await navigate('/login', { replace: true, state: null })
      } finally {
        // 화면 이동에 문제가 생겨도 로그인 정보와 캐시는 반드시 제거합니다.
        useAuthStore.getState().clear()
        try {
          await queryClient.cancelQueries()
        } finally {
          queryClient.clear()
        }
      }
    },
  })
}