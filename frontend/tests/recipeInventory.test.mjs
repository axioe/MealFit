import test from 'node:test'
import assert from 'node:assert/strict'
import { compareRecipeIngredient, RECIPE_STOCK_STATUS as STATUS, validRecipeDate, validRecipeId, validRecipeServings } from '../src/api/recipeInventory.js'

const ingredient = { ingredientName: '양파', quantity: 50, unit: 'g' }
const lot = (quantity, unit = 'g', extra = {}) => ({ ingredientName: '양파', quantity, unit, status: 'ACTIVE', expirationStatus: 'NORMAL', ...extra })
const groups = (...lots) => [{ ingredientName: '양파', lots }]

test('같은 단위의 재고가 충분하면 충분함을 표시한다', () => {
  const result = compareRecipeIngredient(ingredient, groups(lot(60)))
  assert.equal(result.status, STATUS.SUFFICIENT)
  assert.equal(result.stockText, '60g')
})
test('부족한 재고의 차이만 정확하게 표시한다', () => {
  const result = compareRecipeIngredient(ingredient, groups(lot(20)))
  assert.equal(result.status, STATUS.SHORTAGE)
  assert.equal(result.shortageText, '30g')
})
test('해당 재료의 재고가 없으면 재고 없음을 표시한다', () => {
  assert.equal(compareRecipeIngredient(ingredient, []).status, STATUS.NONE)
})
test('개수 재고를 무게로 임의 환산하지 않는다', () => {
  const result = compareRecipeIngredient(ingredient, groups(lot(4, '개')))
  assert.equal(result.status, STATUS.DIFFERENT_UNIT)
  assert.equal(result.stockText, '4개')
})
test('kg와 g는 공식 정책에 따라 비교한다', () => {
  const result = compareRecipeIngredient({ ...ingredient, quantity: 700 }, groups(lot(0.5, 'kg'), lot(200)))
  assert.equal(result.status, STATUS.SUFFICIENT)
  assert.equal(result.availableText, '700g')
})
test('L와 ml는 대소문자를 포함한 공식 정책에 따라 비교한다', () => {
  const result = compareRecipeIngredient({ ...ingredient, quantity: 500, unit: 'mL' }, groups(lot(0.5, 'L')))
  assert.equal(result.status, STATUS.SUFFICIENT)
  assert.equal(result.availableText, '500ml')
})
test('서로 다른 포장·부피·무게 계열은 비교하지 않는다', () => {
  for (const unit of ['팩', '봉', 'ml']) assert.equal(compareRecipeIngredient(ingredient, groups(lot(1000, unit))).status, STATUS.DIFFERENT_UNIT)
})
test('앞뒤 공백만 제거하고 유사한 재료명은 합치지 않는다', () => {
  assert.equal(compareRecipeIngredient(ingredient, groups(lot(50, 'g', { ingredientName: ' 양파 ' }))).status, STATUS.SUFFICIENT)
  assert.equal(compareRecipeIngredient(ingredient, groups(lot(50, 'g', { ingredientName: '적양파' }))).status, STATUS.NONE)
})
test('기한 경과·소진·폐기 재고는 제외한다', () => {
  const result = compareRecipeIngredient(ingredient, groups(lot(100, 'g', { expirationStatus: 'EXPIRED' }), lot(100, 'g', { status: 'DEPLETED' }), lot(100, 'g', { status: 'DISPOSED' })))
  assert.equal(result.status, STATUS.NONE)
  assert.equal(result.expiredCount, 1)
})
test('오늘 만료 및 기한 미등록 재고는 포함한다', () => {
  assert.equal(compareRecipeIngredient(ingredient, groups(lot(25, 'g', { expirationStatus: 'TODAY' }), lot(25, 'g', { expirationStatus: 'UNKNOWN' }))).status, STATUS.SUFFICIENT)
})
test('다른 단위의 재고가 있어도 비교 가능한 재고만 부족량에 반영한다', () => {
  const result = compareRecipeIngredient(ingredient, groups(lot(20), lot(4, '개')))
  assert.equal(result.status, STATUS.SHORTAGE)
  assert.equal(result.shortageText, '30g')
  assert.equal(result.hasIncompatibleUnits, true)
})
test('여러 로트와 소수점 수량을 정확히 합산한다', () => {
  const result = compareRecipeIngredient({ ...ingredient, quantity: 0.3 }, groups(lot(0.1), lot(0.2)))
  assert.equal(result.status, STATUS.SUFFICIENT)
  assert.equal(result.availableText, '0.3g')
})
test('큰 재고 합계에서도 비교 정밀도를 잃지 않는다', () => {
  const result = compareRecipeIngredient(ingredient, groups(...Array.from({ length: 10 }, () => lot('999999999.999', 'kg'))))
  assert.equal(result.availableText, '9,999,999,999,990g')
})
test('잘못된 수량은 재고 없음으로 오인하지 않는다', () => {
  assert.equal(compareRecipeIngredient(ingredient, groups(lot(-1))).status, STATUS.UNKNOWN)
})
test('레시피 번호는 양의 Long 범위만 허용한다', () => {
  for (const value of ['abc', '0', '-1', '1.5', '9223372036854775808', undefined]) assert.equal(validRecipeId(value), false)
  assert.equal(validRecipeId('9223372036854775807'), true)
})
test('인분은 API Integer 범위의 양의 정수만 허용한다', () => {
  for (const value of ['', '0', '-1', '1.5', 'NaN', '2147483648']) assert.equal(validRecipeServings(value), false)
  assert.equal(validRecipeServings('3'), true)
})
test('추천으로 돌아갈 날짜는 실제 날짜인지 검증한다', () => {
  assert.equal(validRecipeDate('2026-10-21'), true)
  assert.equal(validRecipeDate('2026-02-30'), false)
  assert.equal(validRecipeDate(null), false)
})
