import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { queryKeys } from '@/api/queryKeys'
import { useAuthStore } from '@/stores/authStore'

/** 회원별로 프로필 조회 캐시를 구분합니다. */
export const profileKeys = {
  detail: (userId) => ['profile', userId],
  settings: (userId) => ['profileDetails', userId],
}

/** 로그인한 회원의 프로필 조회·수정 요청입니다. */
export const profileApi = {
  getDetails: () => api.get('/me/profile/details').then((response) => response.data),
  updateSection: ({ section, body }) =>
    api.put('/me/profile/details/' + section, body).then((response) => response.data),
  getProfile: () =>
    api.get('/me/profile').then((response) => response.data),

  updateProfile: (body) =>
    api.put('/me/profile', body).then((response) => response.data),
}

/** 마이페이지에서 서버에 저장된 프로필을 불러옵니다. */
export function useMyProfile() {
  const userId = useAuthStore((state) => state.user?.id)

  return useQuery({
    queryKey: profileKeys.detail(userId),
    queryFn: profileApi.getProfile,

    // 로그인한 회원 정보가 있을 때만 조회합니다.
    enabled: Boolean(userId),

    // 화면에 다시 들어오면 최신 프로필을 확인합니다.
    staleTime: 0,
    retry: false,
  })
}

/** 프로필을 저장하고 화면에 표시되는 회원 정보를 갱신합니다. */
export function useUpdateMyProfile() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((state) => state.user?.id)

  return useMutation({
    mutationFn: profileApi.updateProfile,
    retry: false,

    onSuccess: async (profile) => {
      const currentUser = useAuthStore.getState().user

      // 요청 중 계정이 변경됐다면 이전 회원의 응답을 반영하지 않습니다.
      if (!currentUser || currentUser.id !== userId) return

      await queryClient.cancelQueries({ queryKey: profileKeys.detail(userId) })
      if (useAuthStore.getState().user?.id !== userId) return

      // 저장 결과를 프로필 조회 캐시에 바로 반영합니다.
      queryClient.setQueryData(profileKeys.detail(userId), profile)

      // 토큰은 유지하고 사이드바 등에 표시되는 닉네임만 변경합니다.
      useAuthStore.setState({
        user: {
          ...currentUser,
          nickname: profile.nickname,
        },
      })

      // 회원 조회와 대시보드 프로필도 최신 정보로 다시 확인합니다.
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profileKeys.settings(userId) }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.auth.me(userId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.dashboard.profile,
        }),
      ])
    },
  })
}

/** 신체·트레이너·식단·운동·체력 설정을 한 번에 조회합니다. */
export function useProfileDetails() {
  const userId = useAuthStore((state) => state.user?.id)
  return useQuery({
    queryKey: profileKeys.settings(userId),
    queryFn: profileApi.getDetails,
    enabled: Boolean(userId),
    staleTime: 0,
    retry: false,
  })
}

/** 탭별 저장 후 공유 프로필과 닉네임 캐시를 함께 갱신합니다. */
export function useUpdateProfileSection() {
  const queryClient = useQueryClient()
  const userId = useAuthStore((state) => state.user?.id)
  return useMutation({
    mutationFn: profileApi.updateSection,
    retry: false,
    onSuccess: async (details) => {
      const currentUser = useAuthStore.getState().user
      if (!currentUser || currentUser.id !== userId) return
      // 조회 중이던 오래된 응답이 저장 결과를 덮지 않게 취소합니다.
      await queryClient.cancelQueries({ queryKey: profileKeys.settings(userId) })
      if (useAuthStore.getState().user?.id !== userId) return
      queryClient.setQueryData(profileKeys.settings(userId), details)
      useAuthStore.setState({ user: { ...currentUser, nickname: details.body.nickname } })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profileKeys.detail(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.auth.me(userId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.profile }),
      ])
    },
  })
}
