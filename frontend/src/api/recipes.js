import { useQuery } from '@tanstack/react-query'
import { api } from '@/api/client'
import { queryKeys } from '@/api/queryKeys'

export function useRecipe(id, servings, enabled) {
  return useQuery({
    queryKey: queryKeys.recipes.detail(id, servings),
    queryFn: () => api.get(`/recipes/${id}`, { params: { servings } }).then((r) => r.data),
    enabled: Boolean(id) && enabled,
  })
}
