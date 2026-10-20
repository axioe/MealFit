import { useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useIsAuthenticated } from '@/stores/authStore'

/** 로그인해야 들어갈 수 있는 화면 */
export function ProtectedRoute() {
  const isAuthenticated = useIsAuthenticated()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}

/**
 * 로그인 상태면 들어갈 필요 없는 화면 (로그인/회원가입).
 * 진입 시점에만 검사한다 — 화면 안에서 로그인에 성공하면 이동은 그 화면(useStartSession)이 정한다.
 */
export function PublicOnlyRoute() {
  const isAuthenticated = useIsAuthenticated()
  const [wasAuthenticatedOnEnter] = useState(isAuthenticated)
  if (wasAuthenticatedOnEnter) {
    return <Navigate to="/dashboard" replace />
  }
  return <Outlet />
}
