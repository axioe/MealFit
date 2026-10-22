import test from 'node:test'
import assert from 'node:assert/strict'
import { loadQuickRecommendations, normalizeQuickRecipes, prepareQuickRecommendationInput, quickUsageBaseline, quickCookingAvailability, prepareQuickUsageDraft } from '../src/api/quickCookingService.js'
import { addUsageIngredient, analyzeUsage, cookingInventoryOptions, usageChanged } from '../src/api/actualUsage.js'
import { selectableIngredients } from '../src/api/quickCooking.js'
const stock = { asOfDate: '2026-10-22', groups: [
  { ingredientName: '달걀', unit: '개', lots: [{ id: 1, ingredientName: '달걀', unit: '개', quantity: 6, status: 'ACTIVE', expirationStatus: 'NORMAL', expiryDate: '2026-10-25' }] },
  { ingredientName: '양파', unit: 'g', lots: [{ id: 2, ingredientName: '양파', unit: 'g', quantity: 300, status: 'ACTIVE', expirationStatus: 'NORMAL' }] },
  { ingredientName: '치즈', unit: '장', lots: [{ id: 3, ingredientName: '치즈', unit: '장', quantity: 3, status: 'ACTIVE', expirationStatus: 'NORMAL' }] },
] }
const groups = selectableIngredients(stock)
const load = () => loadQuickRecommendations(groups, { servings: '2', maxCookTimeMin: '15' })
test('mock 서비스는 출처를 구분하며 식단·DB 레시피 식별자를 만들지 않는다', () => {
  const result = load(); assert.equal(result.source, 'mock'); assert.equal(result.recipes.length, 2)
  assert.equal(result.recipes[0].recipeId, null); assert.equal(result.recipes[0].mealPlanId, null)
  assert.equal(result.input.servings, 2); assert.equal(result.recipes[0].servings, null)
})
test('선택 재고·단위·기한을 내부 입력으로 보존한다', () => {
  const input = prepareQuickRecommendationInput(groups, { servings: 1, maxCookTimeMin: 15 })
  assert.equal(input.ingredients[0].inventoryReferences[0].expiryDate, '2026-10-25')
  assert.equal(input.ingredients[0].unit, '개'); assert.equal(input.ingredients[0].quantity, '6')
})
test('빈 선택과 미연결 실제 서비스를 거부하며 네트워크 대체 성공을 만들지 않는다', () => {
  assert.throws(() => prepareQuickRecommendationInput([], { servings: 1, maxCookTimeMin: 15 }), /선택/)
  assert.throws(() => loadQuickRecommendations(groups, { servings: 1, maxCookTimeMin: 15 }, 'server'), /아직/)
})
test('없는 필드는 생성하지 않고 빈 결과를 허용한다', () => {
  assert.deepEqual(normalizeQuickRecipes([], 'mock'), [])
  const item = normalizeQuickRecipes([{ name: '요리' }], 'server')[0]
  assert.equal(item.servings, null); assert.equal(item.cookTimeMin, null); assert.deepEqual(item.ingredients, []); assert.deepEqual(item.steps, [])
  assert.throws(() => normalizeQuickRecipes({}, 'mock')); assert.throws(() => normalizeQuickRecipes([{}], 'mock'))
})
test('추천 모델을 공통 사용 재료 모델로 변환하고 수량과 순서를 보존한다', () => {
  const recipe = load().recipes[0]; const baseline = quickUsageBaseline(recipe)
  assert.equal(baseline[0].ingredientName, '달걀'); assert.equal(baseline[0].quantity, '2'); assert.equal(baseline[1].unit, 'g')
})
test('제외·수량 수정·추가·제거·원복은 하루 식단 편집 로직을 재사용한다', () => {
  const recipe = load().recipes[0]; const baseline = quickUsageBaseline(recipe)
  let rows = baseline.map((row) => ({ ...row })); rows[0].quantity = '3'; rows[1].enabled = false
  rows = addUsageIngredient(rows, cookingInventoryOptions(stock)[2]); rows[2].quantity = '1'
  const analysis = analyzeUsage(rows, baseline, stock, true)
  assert.equal(analysis.dirty, true); assert.deepEqual(analysis.errors, {})
  const draft = prepareQuickUsageDraft(recipe, rows, analysis)
  assert.equal(draft.context.mealPlanId, null); assert.deepEqual(draft.items.map((item) => item.ingredientName), ['달걀', '치즈'])
  assert.deepEqual(draft.items[1].inventoryReferences, [{ lotId: 3, unit: '장' }])
  rows = baseline.map((row) => ({ ...row })); assert.equal(usageChanged(rows, baseline), false)
})
test('중복·단위 불일치·재고 변경을 검증한다', () => {
  const baseline = quickUsageBaseline(load().recipes[0]); assert.throws(() => addUsageIngredient(baseline, cookingInventoryOptions(stock)[0]), /이미/)
  const changed = structuredClone(stock); changed.groups[1].lots[0].unit = '개'
  assert.match(analyzeUsage(baseline, baseline, changed, true).errors['recipe:1'], /단위/)
  changed.groups[0].lots[0].quantity = 1
  assert.match(analyzeUsage(baseline, baseline, changed, true).errors['recipe:0'], /부족/)
})
test('추천별 모델은 독립적이며 수정 내용이 다른 요리로 유출되지 않는다', () => {
  const recipes = load().recipes; const first = quickUsageBaseline(recipes[0]); first[0].quantity = '999'
  assert.equal(quickUsageBaseline(recipes[0])[0].quantity, '2'); assert.equal(quickUsageBaseline(recipes[1])[0].quantity, '200')
})
test('기본값·수정 상태·실제 출처 표기 모두 현재 조리 API를 허용하지 않는다', () => {
  for (const recipe of [...load().recipes, { source: 'server', mealPlanId: 91 }]) assert.equal(quickCookingAvailability(recipe).canComplete, false)
})
