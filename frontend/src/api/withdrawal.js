import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { api } from '@/api/client'
import { requestWithdrawal, clearWithdrawalSession } from '@/api/withdrawalFlow'
import { useAuthStore } from '@/stores/authStore'

/** 탈퇴 성공 시에만 세션을 정리하며, 비밀번호를 로그인 Store 등에 저장하지 않습니다. */
export function useWithdraw() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    retry: false,
    // 비밀번호가 포함된 요청 변수는 화면이 해제되면 캐시에 남기지 않습니다.
    gcTime: 0,
    mutationFn: async ({ password, confirmed }) => {
      const userId = useAuthStore.getState().user?.id
      if (!userId) throw new Error('로그인이 필요합니다.')
      await requestWithdrawal(api, password, confirmed)
      return userId
    },
    onSuccess: (userId) => clearWithdrawalSession({
      isCurrentSession: () => useAuthStore.getState().user?.id === userId,
      navigate,
      cancelQueries: () => queryClient.cancelQueries(),
      clearSession: () => useAuthStore.getState().clear(),
      clearCache: () => queryClient.clear(),
    }),
  })
}
