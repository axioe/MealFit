import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { queryKeys } from '@/api/queryKeys'

export const shoppingApi = {
  getItems: () => api.get('/shopping-items').then((r) => r.data),
  purchase: (body) => api.patch('/shopping-items', body).then((r) => r.data),
  stockIn: (body) => api.post('/shopping-items/stock-in', body).then((r) => r.data),
}

export function useShopping() {
  return useQuery({ queryKey: queryKeys.shopping.all, queryFn: shoppingApi.getItems,
    refetchOnMount: 'always', retry: false })
}

export function useShoppingAction() {
  const client = useQueryClient()
  return useMutation({
    retry: false,
    mutationFn: ({ action, body }) => shoppingApi[action](body),
    onSuccess: (result, { action }) => {
      client.setQueryData(queryKeys.shopping.all, action === 'stockIn' ? result.shoppingItems : result)
      if (action === 'stockIn') client.invalidateQueries({ queryKey: queryKeys.inventory.all })
      client.invalidateQueries({ queryKey: queryKeys.shopping.all })
      client.invalidateQueries({ queryKey: queryKeys.dashboard.all })
    },
  })
}
