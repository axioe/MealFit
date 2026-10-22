import { queryKeys } from './queryKeys.js'
import { validRecipeDate, validRecipeId } from './recipeInventory.js'
import { MEAL_PLAN_STATUS, MEAL_TYPE } from '../lib/enums.js'

export const cookingKeys = { all: ['cooking'], preview: (id, servings) => ['cooking', 'preview', String(id), servings] }

export function resolveCookingTarget({ mealPlanId, recipeId, date, servings, result, isFetching, isError, recipeReady }) {
  if (!validRecipeId(mealPlanId) || !validRecipeDate(date)) return { plan: null, reason: '식단 추천에서 요리할 식단을 선택해 주세요.' }
  if (isFetching || isError || result?.planDate !== date) return { plan: null, reason: '요리할 식단의 최신 상태를 확인해 주세요.' }
  const plan = result.mealPlans?.find((row) => String(row.id) === String(mealPlanId) && row.planDate === date && String(row.recipe?.id) === String(recipeId) && Object.values(MEAL_TYPE).includes(row.mealType))
  if (!plan || typeof plan.cooked !== 'boolean') return { plan: null, reason: '선택한 식단의 요리 정보를 확인할 수 없어요. 식단 추천에서 다시 선택해 주세요.' }
  const reason = plan.status !== MEAL_PLAN_STATUS.CONFIRMED ? '확정된 식단만 조리할 수 있습니다.'
    : !recipeReady ? '선택한 인분의 레시피를 확인하고 있어요.'
    : Number(servings) !== plan.servings ? `이 식단은 ${plan.servings}인분으로 확정됐어요. 같은 인분으로 맞춰 주세요.` : ''
  return { plan, reason }
}

export function validateCookingPreview(preview, plan) {
  if (!preview || String(preview.mealPlanId) !== String(plan.id) || preview.servings !== plan.servings || typeof preview.canCook !== 'boolean' || !Array.isArray(preview.ingredients)) throw new Error('조리 미리보기와 선택 식단이 일치하지 않습니다. 다시 조회해 주세요.')
  return preview
}

export function canCancelCooking(plan, event) {
  return Boolean(plan?.cooked && plan.status === MEAL_PLAN_STATUS.CONFIRMED && event?.status === 'COOKED' && validRecipeId(event.id) && String(event.mealPlanId) === String(plan.id))
}

export async function refreshCookingQueries(client, date) {
  await Promise.allSettled([
    queryKeys.inventory.all, queryKeys.mealPlans.byDate(date), queryKeys.shopping.all, queryKeys.dashboard.all, cookingKeys.all,
  ].map((queryKey) => client.invalidateQueries({ queryKey })))
}

export function cookingErrorMessage(error) {
  const code = error?.response?.data?.code
  const messages = {
    COOKING_001: '조리 기록을 찾을 수 없습니다. 식단 상태를 다시 확인해 주세요.',
    COOKING_002: '확정되지 않은 식단입니다. 식단 상태를 다시 확인해 주세요.',
    COOKING_003: '이미 조리 완료한 식단입니다. 최신 상태를 확인해 주세요.',
    COOKING_004: '재고가 부족하거나 요리 전 확인한 내용이 바뀌었어요. 재료를 다시 확인해 주세요.',
    COOKING_005: '이미 취소한 조리입니다. 최신 상태를 확인해 주세요.',
  }
  return messages[code] ?? error?.response?.data?.message ?? '처리 결과를 확인하지 못했습니다. 같은 요청을 반복하지 말고 최신 상태를 다시 확인해 주세요.'
}

export function createCookingSubmission() {
  let pending = false
  return async (operation) => {
    if (pending) return undefined
    pending = true
    try { return await operation() } finally { pending = false }
  }
}
