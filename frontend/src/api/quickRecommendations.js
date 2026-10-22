import { useMutation } from '@tanstack/react-query'
import { api } from './client'
import { createQuickRecipesApi } from './quickRecipeRequests.js'

export const quickRecipesApi = createQuickRecipesApi(api)
export function useQuickRecommendation() {
  return useMutation({ mutationFn: quickRecipesApi.recommend, retry: false })
}
