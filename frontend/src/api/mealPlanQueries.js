import { queryKeys } from './queryKeys.js'
import { validRecipeDate } from './recipeInventory.js'
import { MEAL_PLAN_STATUS } from '../lib/enums.js'

export function validateMealPlanDateResult(result, date) {
  if (result?.planDate !== date || !Array.isArray(result.mealPlans)
      || result.mealPlans.some((plan) => plan.planDate !== date
        || ![MEAL_PLAN_STATUS.DRAFT, MEAL_PLAN_STATUS.CONFIRMED].includes(plan.status))) {
    throw new Error('요청 날짜와 식단 조회 결과가 일치하지 않습니다. 다시 조회해 주세요.')
  }
  return result
}

export function mealPlanQueryOptions(date, getByDate) {
  return {
    queryKey: queryKeys.mealPlans.byDate(date),
    queryFn: async ({ signal }) => validateMealPlanDateResult(await getByDate(date, signal), date),
    enabled: validRecipeDate(date),
    staleTime: 0,
    refetchOnMount: 'always',
    retry: false,
  }
}

export function visibleMealPlans(result, date, { isFetching, isError }) {
  // 최신 상태를 확인하지 못한 날짜의 확정 표시를 숨긴다.
  if (isFetching || isError || result?.planDate !== date) return []
  return result?.mealPlans ?? []
}

export async function refreshMealPlanQueries(client, { date, action }) {
  const refreshes = [
    client.invalidateQueries({ queryKey: queryKeys.mealPlans.byDate(date), exact: true }),
    client.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
  ]
  if (action === 'confirm' || action === 'cancel') {
    refreshes.push(client.invalidateQueries({ queryKey: queryKeys.shopping.all }))
  }
  await Promise.all(refreshes)
}
