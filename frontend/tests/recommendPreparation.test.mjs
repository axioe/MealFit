import test from 'node:test'
import assert from 'node:assert/strict'
import { adaptMockQuickRecipes, prepareQuickCookingInput, splitQuickIngredients, quickRecipeGrid } from '../src/api/quickCookingView.js'
import { quickCookingExamples } from '../src/api/quickCooking.js'
import { defaultFavorites, favoriteSupport } from '../src/api/favoriteIngredients.js'

const group = (ingredientName, quantity, unit) => ({ ingredientName, quantity, unit, lots: [{ id: 9, ingredientName, quantity, unit, status: 'ACTIVE', expirationStatus: 'NORMAL' }] })
test('기본 즐겨찾기는 서버 저장 없이 등록 기본값만 제공한다', () => {
  assert.equal(favoriteSupport.canPersist, false)
  assert.equal(defaultFavorites.length, 8)
  assert.ok(defaultFavorites.every((item) => Number(item.quantity) > 0 && item.unit && item.ingredientName))
  assert.throws(() => { defaultFavorites[0].quantity = '999' }, TypeError)
})
test('연동 준비 입력은 선택 로트·원래 단위·인분·시간을 보존하고 원본을 변경하지 않는다', () => {
  const groups = [group('양파', '4', '개')]
  const before = JSON.stringify(groups)
  assert.deepEqual(prepareQuickCookingInput(groups, { servings: '2', maxCookTimeMin: '15' }), { servings: 2, maxCookTimeMin: 15, ingredients: [{ ingredientName: '양파', quantity: '4', unit: '개', lotIds: [9] }] })
  assert.equal(JSON.stringify(groups), before)
})
test('인분·시간의 잘못된 경계값은 추천 준비 단계에서 거부한다', () => {
  for (const [servings, maxCookTimeMin] of [[0,15],[11,15],[1,0],[1,16],[1.5,15],['',15],[1,'']]) assert.throws(() => prepareQuickCookingInput([], {servings,maxCookTimeMin}))
})
test('부분 보유 재료는 활용 및 부족 영역에 정확히 나뉜다', () => {
  const cards = adaptMockQuickRecipes(quickCookingExamples(), [group('달걀', 1, '개')])
  const split = splitQuickIngredients(cards[0].comparisons)
  assert.equal(split.available[0].ingredientName, '달걀')
  assert.equal(split.missing[0].shortageText, '1개')
  assert.equal(split.missing[1].ingredientName, '양파')
})
test('다른 단위는 가짜 부족량 대신 비교 불가로 분리한다', () => {
  const cards = adaptMockQuickRecipes(quickCookingExamples(), [group('양파', 4, '개')])
  const split = splitQuickIngredients(cards[0].comparisons)
  assert.equal(split.incomparable[0].ingredientName, '양파')
  assert.equal(split.missing.some((item) => item.ingredientName === '양파'), false)
})
test('mock ID는 실제 상세 링크로 승격되지 않고 실제 영양·대체 정보가 생성되지 않는다', () => {
  const cards = adaptMockQuickRecipes(quickCookingExamples(), [])
  assert.ok(cards.every((item) => item.source === 'mock' && item.recipeId === null && item.proteinG === undefined && item.substitutions === undefined))
})
test('1·2·3개 카드 레이아웃은 한 열·두 열·최대 세 열로 구분한다', () => {
  assert.equal(quickRecipeGrid(1), 'grid gap-4')
  assert.equal(quickRecipeGrid(2), 'grid gap-4 md:grid-cols-2')
  assert.equal(quickRecipeGrid(3), 'grid gap-4 md:grid-cols-2 xl:grid-cols-3')
})
