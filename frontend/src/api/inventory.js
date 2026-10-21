import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { queryKeys } from '@/api/queryKeys'

export const inventoryApi = {
  getLots: () => api.get('/inventory/lots').then((response) => response.data),
  stockIn: (body) => api.post('/inventory/lots', body).then((response) => response.data),
}

export function useInventory() {
  return useQuery({
    queryKey: queryKeys.inventory.all,
    queryFn: inventoryApi.getLots,
  })
}

export function useStockIn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: inventoryApi.stockIn,
    retry: false,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all }),
  })
}
