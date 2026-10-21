import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { queryKeys } from '@/api/queryKeys'
import { mergeMealResponse } from './mealPlanSnapshot.js'

export const mealPlansApi = {
  recommend: (body) => api.post('/meal-plans/recommend', body).then((r) => r.data),
  regenerate: (id) => api.post(`/meal-plans/${id}/regenerate`).then((r) => r.data),
  confirm: (id) => api.post(`/meal-plans/${id}/confirm`).then((r) => r.data),
  cancel: (id) => api.post(`/meal-plans/${id}/cancel`).then((r) => r.data),
}

const sessionKey = (date) => `mealfit:meal-response:${api.defaults.headers.common['X-User-Id'] ?? '1'}:${date}`

function readSnapshot(date) {
  try {
    const saved = JSON.parse(sessionStorage.getItem(sessionKey(date)))
    return saved?.planDate === date && Array.isArray(saved.mealPlans) ? saved : undefined
  } catch { return undefined }
}

export function useMealPlanSnapshot(date) {
  return useQuery({
    queryKey: queryKeys.mealPlans.byDate(date),
    enabled: false,
    queryFn: () => readSnapshot(date) ?? null,
    initialData: () => readSnapshot(date),
  })
}

export function useMealPlanAction() {
  const client = useQueryClient()
  return useMutation({
    retry: false,
    mutationFn: ({ action, id, date, servings }) => action === 'recommend'
      ? mealPlansApi.recommend({ planDate: date, servings }) : mealPlansApi[action](id),
    onSuccess: (result, { action, date }) => {
      // 조회 API가 없어 마지막 서버 응답만 세션에 보관한다.
      client.setQueryData(queryKeys.mealPlans.byDate(date), (previous) => mergeMealResponse(previous, result, action, date))
      try {
        sessionStorage.setItem(sessionKey(date), JSON.stringify(client.getQueryData(queryKeys.mealPlans.byDate(date))))
      } catch { /* 세션 저장 실패가 서버 처리 성공을 바꾸지 않는다. */ }
      if (action === 'confirm' || action === 'cancel') {
        client.invalidateQueries({ queryKey: queryKeys.shopping.all })
        client.invalidateQueries({ queryKey: queryKeys.dashboard.all })
      }
    },
  })
}
