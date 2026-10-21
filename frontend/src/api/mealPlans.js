import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { queryKeys } from '@/api/queryKeys'
import { mealPlanQueryOptions, refreshMealPlanQueries } from './mealPlanQueries.js'

export const mealPlansApi = {
  getByDate: (date, signal) => api.get('/meal-plans', { params: { date }, signal }).then((r) => r.data),
  recommend: (body) => api.post('/meal-plans/recommend', body).then((r) => r.data),
  regenerate: (id) => api.post(`/meal-plans/${id}/regenerate`).then((r) => r.data),
  confirm: (id) => api.post(`/meal-plans/${id}/confirm`).then((r) => r.data),
  cancel: (id) => api.post(`/meal-plans/${id}/cancel`).then((r) => r.data),
}

export function useMealPlans(date) {
  return useQuery(mealPlanQueryOptions(date, mealPlansApi.getByDate))
}

export function useMealPlanAction() {
  const client = useQueryClient()
  return useMutation({
    retry: false,
    onMutate: ({ date }) => client.cancelQueries({ queryKey: queryKeys.mealPlans.byDate(date), exact: true }),
    mutationFn: ({ action, id, date, servings }) => action === 'recommend'
      ? mealPlansApi.recommend({ planDate: date, servings }) : mealPlansApi[action](id),
    // 처리 결과와 무관하게 서버 상태를 다시 확인한다.
    onSettled: (_result, _error, variables) => refreshMealPlanQueries(client, variables),
  })
}
