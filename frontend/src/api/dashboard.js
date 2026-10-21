import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'
import { dashboardMock } from '@/api/mocks/dashboardMock'
import { queryKeys } from '@/api/queryKeys'

/**
 * [임시] 대시보드·섭취 기록 API(최원석 담당)가 완성되기 전까지 예시 데이터를 쓴다.
 * TODO(대시보드 API 완성 시): USE_MOCK을 false로 바꾸고, api/mocks/dashboardMock.js를 지운다.
 *   서버 응답이 아래 형식과 다르면 화면(DashboardPage)이 아니라 여기서 맞춘다.
 */
export const USE_MOCK = true

/*
 * 응답 형식 (GET /api/v1/dashboard?date=YYYY-MM-DD)
 * {
 *   date: '2026-10-21',
 *   meals: [                       // 그날의 식단 (아침·점심·저녁 중 있는 것만). 필드는 MealPlanResponse + intakeStatus
 *     { id, planDate, mealType, status, servings, recommendationReason,
 *       recipe: { id, name, cookTimeMin, calories, nutritionEstimated, source },
 *       intakeStatus }             // PLANNED | EATEN | SKIPPED, 확정 전이면 null
 *   ],
 *   expiringLots: [                // 기한 경과·오늘·임박(3일 이내) 재고 묶음. 필드는 LotResponse와 같다
 *     { id, ingredientName, quantity, unit, expiryDate, storageLocation, status, expirationStatus }
 *   ],
 *   shortages: [                   // 장보기 부족분 (구매 완료 제외)
 *     { id, ingredientName, requiredQty, purchasedQty, unit, status }
 *   ]
 * }
 *
 * 섭취 기록 (POST /api/v1/intake-logs)
 *   요청 { mealPlanId, intakeStatus: 'EATEN' | 'SKIPPED' }
 *   응답 { id, mealPlanId, intakeStatus, loggedAt }
 */
export const dashboardApi = {
  getDashboard: (date) =>
    USE_MOCK ? dashboardMock.getDashboard(date) : api.get('/dashboard', { params: { date } }).then((r) => r.data),
  recordIntake: (body) =>
    USE_MOCK ? dashboardMock.recordIntake(body) : api.post('/intake-logs', body).then((r) => r.data),
}

export function useDashboard(date) {
  return useQuery({
    queryKey: queryKeys.dashboard.byDate(date),
    queryFn: () => dashboardApi.getDashboard(date),
  })
}

export function useRecordIntake() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: dashboardApi.recordIntake,
    retry: false,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
  })
}
