import axios from 'axios'

/**
 * 모든 API 호출은 이 인스턴스를 쓴다.
 *
 * 서버 에러 응답 형식 (backend: global/exception/ErrorResponse)
 *   { status, code, message, errors: [{ field, message }], timestamp }
 *
 * TODO(로그인 담당): 로그인 구현 시 여기에 인증 토큰 첨부(request 인터셉터)와
 * 401 처리(response 인터셉터)를 추가한다. 그 전까지 서버는 X-User-Id 헤더(없으면 1번 사용자)로 동작한다.
 */
export const api = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000, // AI 추천은 최대 20초 + 여유
})

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

/** 서버 에러 코드 (예: 'INVENTORY_001'). 코드별 분기 처리에 사용 */
export function getErrorCode(error) {
  return axios.isAxiosError(error) ? error.response?.data?.code : undefined
}
