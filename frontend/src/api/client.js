import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

/**
 * 모든 API 호출은 이 인스턴스를 쓴다.
 * - Access 토큰 자동 첨부
 * - 401이면 Refresh 토큰으로 한 번 갱신 후 원래 요청 재시도 (동시에 여러 요청이 실패해도 갱신은 1번)
 *
 * 서버 에러 응답 형식 (backend: global/exception/ErrorResponse)
 *   { status, code, message, errors: [{ field, message }], timestamp }
 */
export const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000, // AI 추천은 최대 20초 + 여유
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise = null

async function refreshAccessToken() {
  const { refreshToken, setSession, clear } = useAuthStore.getState()
  if (!refreshToken) {
    clear()
    throw new Error('no refresh token')
  }
  try {
    // 인터셉터를 타지 않도록 axios 기본 인스턴스로 호출
    const { data } = await axios.post('/api/v1/auth/refresh', { refreshToken })
    setSession(data)
    return data.accessToken
  } catch (e) {
    clear()
    throw e
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    const isAuthCall = original?.url?.startsWith('/auth/')
    if (error.response?.status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null
      })
      const newToken = await refreshPromise
      original.headers.Authorization = `Bearer ${newToken}`
      return api(original)
    }
    return Promise.reject(error)
  },
)

/** 화면에 보여줄 에러 메시지. 서버 ErrorResponse.message → 없으면 기본 문구 */
export function getErrorMessage(error, fallback = '요청을 처리하지 못했습니다.') {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data
    if (data?.errors?.length) {
      return data.errors.map((e) => e.message).join('\n')
    }
    return data?.message ?? fallback
  }
  return fallback
}

/** 서버 에러 코드 (예: 'AUTH_001'). 코드별 분기 처리에 사용 */
export function getErrorCode(error) {
  return axios.isAxiosError(error) ? error.response?.data?.code : undefined
}
