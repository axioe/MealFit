import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { queryKeys } from '@/api/queryKeys'

export const recipesApi = {
  getDetail: (id, servings, signal) => api.get(`/recipes/${id}`, { params: { servings }, signal }).then((r) => r.data),
}

export function useRecipe(id, servings, enabled = true) {
  return useQuery({
    queryKey: queryKeys.recipes.detail(id, servings),
    queryFn: ({ signal }) => recipesApi.getDetail(id, servings, signal),
    enabled: Boolean(id) && enabled,
    retry: false,
    staleTime: 0,
    refetchOnMount: 'always',
  })
}
