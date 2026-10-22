import { validRecipeId } from './recipeInventory.js'

export function cookingBody(mode, context, rows) {
  const enabled = rows.filter((row) => row.enabled)
  if (!enabled.length || enabled.length > (mode === 'meal' ? 100 : 30)) throw new Error('사용할 재료 개수를 확인해 주세요.')
  if (mode === 'meal' && enabled.some((row) => row.added)) throw new Error('식단 요리에는 추가한 재료를 자동 반영할 수 없어요. 추가 재료를 사용하지 않음으로 바꾸거나 제거해 주세요.')
  const ingredients = enabled.map((row) => {
    if (!row.ingredientName?.trim() || row.ingredientName.trim().length > 100 || !row.unit?.trim() || row.unit.trim().length > 20
      || !/^\d+(?:\.\d{1,3})?$/.test(String(row.quantity))) throw new Error('재료 수량과 단위를 확인해 주세요.')
    const [whole, fraction = ''] = String(row.quantity).split('.')
    const amount = BigInt(whole) * 1000n + BigInt(fraction.padEnd(3, '0'))
    if (amount <= 0n || amount > 999999999999n) throw new Error('사용 수량은 0보다 크고 정수 9자리·소수 3자리 이내여야 해요.')
    return { ingredientName: row.ingredientName.trim(), quantity: String(row.quantity), unit: row.unit.trim() }
  })
  if (mode === 'meal') {
    if (!validRecipeId(context.mealPlanId)) throw new Error('식단 정보를 다시 확인해 주세요.')
    return { mealPlanId: context.mealPlanId, ingredients }
  }
  if (mode !== 'ingredients' || !context.recipeName?.trim() || context.recipeName.trim().length > 100) throw new Error('요리 이름을 확인해 주세요.')
  if (context.servings != null && (!Number.isInteger(context.servings) || context.servings < 1 || context.servings > 10)) throw new Error('인분은 1~10으로 입력해 주세요.')
  return { recipeName: context.recipeName.trim(), ...(context.servings == null ? {} : { servings: context.servings }), ingredients }
}

export function validateUsagePreview(preview, body, mode) {
  if (!preview || typeof preview.canCook !== 'boolean' || !Array.isArray(preview.ingredients)
    || (mode === 'meal' ? String(preview.mealPlanId) !== String(body.mealPlanId) : preview.mealPlanId != null || preview.recipeName !== body.recipeName || preview.servings !== (body.servings ?? 1))) {
    throw new Error('선택한 요리와 미리보기가 일치하지 않아요. 다시 확인해 주세요.')
  }
  return preview
}

export function validateCookingEvent(result, body, mode, action, eventId) {
  if (!validRecipeId(result?.id) || !Array.isArray(result.changes)
    || (action === 'cancel' ? String(result.id) !== String(eventId) || result.status !== 'RESTORED'
      : !['COOKED', 'RESTORED'].includes(result.status))
    || (mode === 'meal' ? String(result.mealPlanId) !== String(body.mealPlanId) : result.mealPlanId != null || result.recipeName !== body.recipeName)) throw new Error('조리 처리 결과를 확인하지 못했어요.')
  return result
}

export function createCookingIntent(uuid = () => {
  if (!globalThis.crypto?.randomUUID) throw new Error('안전한 조리 요청을 위해 HTTPS 또는 localhost 환경을 사용해 주세요.')
  return globalThis.crypto.randomUUID()
}) {
  let current = null
  return {
    prepare(body) {
      const signature = JSON.stringify(body)
      if (current?.signature !== signature) current = { signature, body: { ...body, clientRequestId: uuid() } }
      return current.body
    },
    clear() { current = null },
  }
}

export const pendingCookingKey = (userId) => `mealfit-pending-cooking:${userId ?? 'anonymous'}`
export function loadPendingCooking(storage, userId) {
  const raw = storage.getItem(pendingCookingKey(userId))
  if (!raw) return null
  const body = JSON.parse(raw)
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.clientRequestId ?? '')) throw new Error('이전 조리 요청 확인이 필요해요.')
  return body
}

export function canCompleteUsage({ preview, ready, requested, snapshot, fetching, pending, uncertain, event }) {
  return Boolean(ready && requested === snapshot && !fetching && !pending && !uncertain && !event
    && preview?.canCook === true && !preview.cooked && preview.ingredients?.length > 0)
}
export function savePendingCooking(storage, userId, body) {
  if (body) storage.setItem(pendingCookingKey(userId), JSON.stringify(body))
  else storage.removeItem(pendingCookingKey(userId))
}
