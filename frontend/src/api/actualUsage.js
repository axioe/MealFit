import { compareRecipeIngredient, RECIPE_STOCK_STATUS, validRecipeId } from './recipeInventory.js'
import { EXPIRATION_STATUS, LOT_STATUS } from '../lib/enums.js'

export const actualUsageSupport = Object.freeze({ preview: false, complete: false })

function decimal(value) {
  const text = String(value ?? '').trim()
  if (!/^\d+(?:\.\d{1,3})?$/.test(text)) return null
  const [whole, fraction = ''] = text.split('.')
  return BigInt(whole) * 1000n + BigInt(fraction.padEnd(3, '0'))
}

function display(value) {
  return `${value / 1000n}${value % 1000n ? '.' + String(value % 1000n).padStart(3, '0').replace(/0+$/, '') : ''}`
}

export function cookingInventoryOptions(inventory) {
  const groups = new Map()
  for (const group of inventory?.groups ?? []) for (const lot of group.lots ?? []) {
    if (lot.status !== LOT_STATUS.ACTIVE || lot.expirationStatus === EXPIRATION_STATUS.EXPIRED
      || (lot.expiryDate && inventory.asOfDate && lot.expiryDate < inventory.asOfDate)
      || !validRecipeId(lot.id) || decimal(lot.quantity) == null || decimal(lot.quantity) <= 0n) continue
    const ingredientName = String(lot.ingredientName ?? group.ingredientName).trim()
    const unit = String(lot.unit ?? group.unit).trim()
    if (!ingredientName || !unit || unit.length > 20) continue
    const key = JSON.stringify([ingredientName, unit])
    const entry = groups.get(key) ?? { key, ingredientName, unit, amount: 0n, lots: [] }
    entry.amount += decimal(lot.quantity)
    entry.lots.push(lot)
    groups.set(key, entry)
  }
  return [...groups.values()].map(({ amount, ...item }) => ({ ...item, quantity: display(amount) }))
}

export function usageBaseline(preview) {
  return preview.ingredients.map((ingredient, index) => ({
    key: `recipe:${index}`, originIndex: index, ingredientName: ingredient.ingredientName,
    recipeQuantity: String(ingredient.requiredQty), quantity: String(ingredient.requiredQty), unit: ingredient.unit,
    enabled: true, added: false,
  }))
}

export function usageChanged(rows, baseline) {
  return rows.length !== baseline.length || rows.some((row, index) => {
    const original = baseline[index]
    return row.added || !original || row.key !== original.key || row.ingredientName !== original.ingredientName
      || row.unit !== original.unit || !row.enabled || decimal(row.quantity) == null || decimal(row.quantity) !== decimal(original.quantity)
  })
}

export function syncUsageSession(session, scope, preview) {
  if (session.scope !== scope) return { scope, baseline: null, rows: [], notice: '인분이나 식단이 바뀌어 이전 수정 내용을 초기화했어요.' }
  if (!preview) return session
  const baseline = usageBaseline(preview)
  const signature = JSON.stringify(baseline)
  if (session.signature !== signature) return { scope, signature, baseline, rows: baseline.map((row) => ({ ...row })), notice: session.baseline ? '레시피 기준이 바뀌어 수정 내용을 초기화했어요.' : session.notice }
  return session
}

export function addUsageIngredient(rows, option) {
  if (!option || !option.lots?.length) throw new Error('현재 냉장고에 보관 중인 재료를 선택해 주세요.')
  if (rows.some((row) => row.ingredientName.trim() === option.ingredientName.trim())) throw new Error('이미 목록에 있는 재료예요. 기존 항목을 수정해 주세요.')
  return [...rows, { key: `inventory:${option.key}`, sourceKey: option.key, ingredientName: option.ingredientName,
    unit: option.unit, quantity: '', recipeQuantity: null, enabled: true, added: true }]
}

export function analyzeUsage(rows, baseline, inventory, inventoryReady) {
  const options = cookingInventoryOptions(inventory)
  const comparisons = new Map()
  const errors = {}
  const names = new Set()
  for (const row of rows) {
    if (!row.enabled) continue
    if (names.has(row.ingredientName.trim()) && row.added) errors[row.key] = '같은 재료를 중복 추가할 수 없어요.'
    names.add(row.ingredientName.trim())
    const amount = decimal(row.quantity)
    if (amount == null || amount <= 0n || amount > 999999999999n) { errors[row.key] = '0보다 큰 수량을 정수 9자리·소수 3자리 이내로 입력해 주세요.'; continue }
    const original = baseline.find((item) => item.key === row.key)
    if ((!row.added && (!original || row.unit !== original.unit || row.ingredientName !== original.ingredientName))
      || (row.added && !options.some((option) => option.key === row.sourceKey && option.unit === row.unit && option.ingredientName === row.ingredientName))) {
      errors[row.key] = '재료와 단위를 현재 냉장고 정보에서 확인할 수 없어요.'; continue
    }
    if (!inventoryReady) { errors[row.key] = '냉장고 재고를 다시 확인해 주세요.'; continue }
    const eligibleGroups = options.map((option) => ({ ...option, lots: option.lots }))
    const comparison = compareRecipeIngredient({ ingredientName: row.ingredientName, quantity: row.quantity, unit: row.unit }, eligibleGroups)
    comparisons.set(row.key, comparison)
    if (comparison.status !== RECIPE_STOCK_STATUS.SUFFICIENT) errors[row.key] = comparison.status === RECIPE_STOCK_STATUS.DIFFERENT_UNIT
      ? '단위가 달라 비교할 수 없어요. 임의로 환산하지 않아요.'
      : comparison.status === RECIPE_STOCK_STATUS.UNKNOWN ? '사용 가능한 수량을 확인할 수 없어요.'
      : `사용 가능한 재고가 부족해요. 부족한 양: ${comparison.shortageText}`
  }
  return { dirty: usageChanged(rows, baseline), errors, comparisons,
    empty: !rows.some((row) => row.enabled), options,
  }
}

// 화면 내부 검토용 모델이며 현재 완료 요청에는 전달하지 않는다.
export function prepareActualUsageDraft(context, rows, analysis) {
  if (analysis.empty || Object.keys(analysis.errors).length) return null
  return { context, items: rows.filter((row) => row.enabled).map((row) => ({
    origin: row.added ? 'inventory' : 'recipe', originIndex: row.originIndex ?? null,
    ingredientName: row.ingredientName, recipeQuantity: row.recipeQuantity, quantity: display(decimal(row.quantity)), unit: row.unit,
    inventoryReferences: analysis.options.filter((option) => option.ingredientName === row.ingredientName
      && (option.unit === row.unit || (['g', 'kg'].includes(option.unit.toLowerCase()) && ['g', 'kg'].includes(row.unit.toLowerCase()))
        || (['ml', 'l'].includes(option.unit.toLowerCase()) && ['ml', 'l'].includes(row.unit.toLowerCase()))))
      .flatMap((option) => option.lots.map((lot) => ({ lotId: lot.id, unit: lot.unit }))),
  })) }
}

export function canUseDefaultCooking({ dirty, empty, inventoryReady, stockChanged }) {
  return !dirty && !empty && inventoryReady && !stockChanged
}
