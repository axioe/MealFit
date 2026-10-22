import { MEAL_PLAN_STATUS } from '../lib/enums.js'
import { validRecipeDate, validRecipeId, validRecipeServings } from './recipeInventory.js'

export function mealCardActions(plan) {
  const draft = plan.status === MEAL_PLAN_STATUS.DRAFT && plan.cooked !== true
  const confirmed = plan.status === MEAL_PLAN_STATUS.CONFIRMED
  const cooked = confirmed && plan.cooked === true
  return { draft, cooked, canCook: confirmed && plan.cooked === false, canCancelPlan: draft || (confirmed && plan.cooked === false) }
}

export function recipePlanLink(plan, cooking = false) {
  if (!validRecipeId(plan.id) || !validRecipeId(plan.recipe?.id) || !validRecipeDate(plan.planDate) || !validRecipeServings(plan.servings)
    || (cooking && !mealCardActions(plan).canCook)) return null
  const params = new URLSearchParams({ servings: String(plan.servings), date: plan.planDate, mealPlanId: String(plan.id) })
  return `/recipes/${plan.recipe.id}?${params}${cooking ? '#cook' : ''}`
}

// 서버가 제공한 사용 계획만 같은 단위끼리 합산한다.
export function plannedUsage(deductions = []) {
  const totals = new Map()
  for (const item of deductions) {
    const text = String(item.quantity)
    if (!/^\d+(?:\.\d{1,3})?$/.test(text)) return []
    const [whole, fraction = ''] = text.split('.')
    totals.set(item.unit, (totals.get(item.unit) ?? 0n) + BigInt(whole) * 1000n + BigInt(fraction.padEnd(3, '0')))
  }
  return [...totals].map(([unit, value]) => ({ unit, quantity: `${value / 1000n}${value % 1000n ? '.' + String(value % 1000n).padStart(3, '0').replace(/0+$/, '') : ''}` }))
}

export function cookingPreviewState(preview) {
  return preview.canCook === true ? '요리 가능' : preview.ingredients.some((item) => Number(item.shortageQty) > 0) ? '재료 부족' : '확인 필요'
}

export function cookingChangeQuantity(change) {
  return String(change.qtyChange).replace(/^-/, '')
}
