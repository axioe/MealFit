import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { queryKeys } from '@/api/queryKeys'
import { useAuthStore } from '@/stores/authStore'
import type { Me, Profile, ProfileUpdateRequest } from '@/types/api'

export const meApi = {
  getMe: () => api.get<Me>('/me').then((r) => r.data),
  getProfile: () => api.get<Profile>('/me/profile').then((r) => r.data),
  updateProfile: (body: ProfileUpdateRequest) => api.put<Profile>('/me/profile', body).then((r) => r.data),
}

export function useProfile() {
  return useQuery({ queryKey: queryKeys.me.profile, queryFn: meApi.getProfile })
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: meApi.updateProfile,
    onSuccess: (profile) => {
      queryClient.setQueryData(queryKeys.me.profile, profile)
      const { user, setUser } = useAuthStore.getState()
      if (user) setUser({ ...user, nickname: profile.nickname })
    },
  })
}
