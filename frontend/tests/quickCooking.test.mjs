import test from 'node:test'
import assert from 'node:assert/strict'
import { selectableIngredients, searchIngredients, quickCookingExamples } from '../src/api/quickCooking.js'

const lot = (id, extra = {}) => ({ id, ingredientName: '양파', unit: 'g', quantity: '0.1', status: 'ACTIVE', expirationStatus: 'NORMAL', ...extra })
const data = (...lots) => ({ asOfDate: '2026-10-21', groups: [{ ingredientName: '양파', unit: 'g', lots }] })
test('활성 로트만 합산하고 기한 경과·소진·폐기·0 재고를 제외한다', () => {
  const result = selectableIngredients(data(lot(1), lot(2, { quantity: '0.2' }), lot(3, { expirationStatus: 'EXPIRED' }), lot(4, { status: 'DEPLETED' }), lot(5, { status: 'DISPOSED' }), lot(6, { quantity: 0 })))
  assert.equal(result.length, 1)
  assert.equal(result[0].quantity, '0.3')
  assert.deepEqual(result[0].lots.map((item) => item.id), [1, 2])
})
test('오늘 만료와 기한 미등록은 허용하고 지난 날짜는 제외한다', () => {
  const result = selectableIngredients(data(lot(1, { expirationStatus: 'TODAY', expiryDate: '2026-10-21' }), lot(2, { expirationStatus: 'UNKNOWN' }), lot(3, { expiryDate: '2026-10-20' })))
  assert.equal(result[0].lots.length, 2)
})
test('다른 단위는 합치거나 환산하지 않는다', () => {
  const result = selectableIngredients(data(lot(1), lot(2, { quantity: 4, unit: '개' })))
  assert.deepEqual(result.map((item) => [item.unit, item.quantity]), [['g', '0.1'], ['개', '4']])
})
test('검색은 공백과 영문 대소문자를 처리한다', () => {
  const items = selectableIngredients(data(lot(1), lot(2, { ingredientName: 'Milk' })))
  assert.equal(searchIngredients(items, ' milk ')[0].ingredientName, 'Milk')
  assert.equal(searchIngredients(items, '없는 재료').length, 0)
})
test('갱신 후 사라지거나 만료된 선택은 현재 선택 대상에서 제외된다', () => {
  const selected = selectableIngredients(data(lot(1))).map((item) => item.key)
  assert.equal(selectableIngredients(data(lot(1, { expirationStatus: 'EXPIRED' }))).filter((item) => selected.includes(item.key)).length, 0)
})
test('예시는 15분 이내이며 실제 레시피 ID와 구분되고 매번 독립적이다', () => {
  const examples = quickCookingExamples()
  assert.ok(examples.every((item) => item.id.startsWith('mock-') && item.cookTimeMin <= 15 && item.steps.length))
  examples[0].ingredients[0].quantity = 999
  assert.equal(quickCookingExamples()[0].ingredients[0].quantity, 2)
})
test('빈 재고와 잘못된 수량을 안전하게 처리한다', () => {
  assert.deepEqual(selectableIngredients(undefined), [])
  assert.deepEqual(selectableIngredients(data(lot(1, { quantity: '-1' }), lot(2, { quantity: '1.0001' }))), [])
})
