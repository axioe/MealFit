import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { queryKeys } from '@/api/queryKeys'

export const inventoryApi = {
  getLots: () => api.get('/inventory/lots').then((response) => response.data),
  getTransactions: (lotId) => api.get('/inventory/transactions', { params: lotId == null ? {} : { lotId } }).then((response) => response.data),
  updateLot: ({ id, body }) => api.patch(`/inventory/lots/${id}`, body).then((response) => response.data),
  stockIn: (body) => api.post('/inventory/lots', body).then((response) => response.data),
}

export function useInventory() {
  return useQuery({
    queryKey: queryKeys.inventory.all,
    queryFn: inventoryApi.getLots,
    refetchOnMount: 'always',
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

export function useInventoryTransactions(lotId) {
  return useQuery({
    queryKey: queryKeys.inventory.transactions(lotId),
    queryFn: () => inventoryApi.getTransactions(lotId),
    refetchOnMount: 'always',
  })
}

export function useUpdateLot() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: inventoryApi.updateLot,
    retry: false,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.inventory.all }),
  })
}
