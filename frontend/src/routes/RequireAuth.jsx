import { useQuery } from '@tanstack/react-query'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { authApi } from '@/api/auth'
import { getErrorMessage } from '@/api/client'
import { queryKeys } from '@/api/queryKeys'
import { useAuthStore } from '@/stores/authStore'
import { Spinner } from '@/components/common/Spinner'

/**
 * 서버가 인증한 사용자에게만 하위 화면을 표시합니다.
 * 저장된 토큰이 있다는 이유만으로 로그인 성공으로 판단하지 않습니다.
 */
export function RequireAuth() {
  const location = useLocation()
  const accessToken = useAuthStore((state) => state.accessToken)
  const refreshToken = useAuthStore((state) => state.refreshToken)
  const userId = useAuthStore((state) => state.user?.id)
  const hasSession = Boolean(accessToken || refreshToken)

  const me = useQuery({
    queryKey: queryKeys.auth.me(userId),
    queryFn: authApi.getMe,
    enabled: hasSession,
    staleTime: 0,
    refetchOnMount: 'always',
    // 자동 갱신과 요청 재시도는 공통 Axios 클라이언트가 담당합니다.
    retry: false,
  })

  if (!hasSession) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search + location.hash }}
      />
    )
  }

  // 처음 인증을 확인하는 동안 보호 화면의 API와 내용을 열지 않습니다.
  if (me.isPending) {
    return (
      <div role="status" className="flex min-h-screen items-center justify-center gap-3 bg-gray-50">
        <Spinner />
        <span className="text-sm text-gray-500">로그인 정보를 확인하고 있습니다.</span>
      </div>
    )
  }

  // 일시적인 통신 장애는 로그아웃으로 단정하지 않고 재시도를 제공합니다.
  if (me.isError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="card space-y-4">
          <p role="alert" className="text-sm text-rose-700">
            {getErrorMessage(me.error)}
          </p>
          <button
            type="button"
            disabled={me.isFetching}
            onClick={() => me.refetch()}
            className="btn-primary min-h-11"
          >
            {me.isFetching ? '확인 중...' : '다시 시도'}
          </button>
        </div>
      </div>
    )
  }

  return <Outlet />
}

