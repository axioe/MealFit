import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPurchase, buildStockIn, quantityInMillis } from '../src/api/shoppingValidation.js'
import { mergeMealResponse } from '../src/api/mealPlanSnapshot.js'

const item = { id: 7, purchasedQty: 0.1, remainingQty: 0.2 }
const form = { quantity: '0.1', storageLocation: 'FRIDGE', expiryDate: '', minStockQty: '0' }

test('부분 구매는 추가량과 기존 구매량을 합쳐 최종 수량으로 전송한다', () => {
  assert.deepEqual(buildPurchase(item, '0.2'), { items: [{ id: 7, purchasedQty: 0.3 }] })
})
test('서버 정책에 맞게 부족량보다 많은 구매도 정밀도 범위 안에서 허용한다', () => {
  assert.equal(buildPurchase(item, '1').items[0].purchasedQty, 1.1)
})
for (const value of ['0', '-1', '0.0001', '1000000000', '', 'NaN']) {
  test(`잘못된 구매 수량 ${JSON.stringify(value)}을 거부한다`, () => assert.throws(() => buildPurchase(item, value)))
}
test('구매량 합계가 DB 범위를 초과하면 거부한다', () => {
  assert.throws(() => buildPurchase({ ...item, purchasedQty: 999999999.999 }, '0.001'))
})
test('최소와 최대 소수점 경계값을 정확하게 다룬다', () => {
  assert.equal(quantityInMillis('0.001'), 1)
  assert.equal(quantityInMillis('999999999.999'), 999999999999)
})
test('구매분만 입고하고 기한 미등록과 최소량 0을 유지한다', () => {
  assert.deepEqual(buildStockIn(item, form), { items: [{ id: 7, quantity: 0.1, storageLocation: 'FRIDGE', minStockQty: 0 }] })
})
test('구매하지 않은 항목과 초과 입고를 차단한다', () => {
  assert.throws(() => buildStockIn({ ...item, purchasedQty: 0 }, form))
  assert.throws(() => buildStockIn(item, { ...form, quantity: '0.101' }))
})
test('부분 입고 수량과 소비기한을 서버 형식 그대로 전달한다', () => {
  assert.deepEqual(buildStockIn(item, { ...form, quantity: '0.001', expiryDate: '2027-01-01' }).items[0],
    { id: 7, quantity: 0.001, storageLocation: 'FRIDGE', minStockQty: 0, expiryDate: '2027-01-01' })
})
test('유효하지 않은 날짜와 보관 위치, 최소량을 차단한다', () => {
  for (const changes of [{ expiryDate: '2027-02-30' }, { storageLocation: 'INVALID' }, { minStockQty: '-1' }]) {
    assert.throws(() => buildStockIn(item, { ...form, ...changes }))
  }
})
const date = '2026-10-21'
const previous = { planDate: date, mealPlans: [
  { id: 1, mealType: 'BREAKFAST', status: 'CONFIRMED' },
  { id: 2, mealType: 'LUNCH', status: 'DRAFT' },
  { id: 3, mealType: 'DINNER', status: 'DRAFT' },
] }
test('한 끼 재추천 시 다른 두 끼와 확정 상태를 보존한다', () => {
  const result = { id: 4, mealType: 'LUNCH', status: 'DRAFT' }
  const merged = mergeMealResponse(previous, result, 'regenerate', date)
  assert.equal(merged.mealPlans.length, 3)
  assert.ok(merged.mealPlans.includes(previous.mealPlans[0]))
  assert.ok(merged.mealPlans.includes(previous.mealPlans[2]))
  assert.ok(merged.mealPlans.includes(result))
  assert.equal(previous.mealPlans[1].id, 2)
})
test('확정 및 취소는 서버 응답의 상태만 반영한다', () => {
  const confirmed = { id: 2, mealType: 'LUNCH', status: 'CONFIRMED' }
  assert.ok(mergeMealResponse(previous, { mealPlan: confirmed, shortages: [] }, 'confirm', date).mealPlans.includes(confirmed))
  const canceled = { ...confirmed, status: 'CANCELED' }
  assert.ok(mergeMealResponse(previous, canceled, 'cancel', date).mealPlans.includes(canceled))
})
test('전체 추천은 유지된 확정 식단을 포함한 서버 결과를 사용한다', () => {
  const result = { planDate: date, mealPlans: [previous.mealPlans[0]] }
  assert.equal(mergeMealResponse(previous, result, 'recommend', date), result)
})

for (const [unit, requiredQty, previousQty, additionalQty] of [
  ['g', 50, 10, 20],
  ['ml', 500, 100, 200],
  ['개', 3, 1, 1],
]) {
  test(`서버 단위 ${unit}의 추가 구매·부분 입고는 환산 없이 수량을 유지한다`, () => {
    const original = { id: 8, unit, requiredQty, purchasedQty: previousQty }
    const body = buildPurchase(original, String(additionalQty))
    const total = previousQty + additionalQty
    assert.deepEqual(body, { items: [{ id: 8, purchasedQty: total }] })
    assert.equal(Math.max(0, requiredQty - body.items[0].purchasedQty), requiredQty - total)
    const purchased = { ...original, purchasedQty: total }
    assert.deepEqual(buildStockIn(purchased, {
      quantity: String(additionalQty), storageLocation: 'FREEZER', expiryDate: '2027-01-01', minStockQty: '0',
    }), { items: [{ id: 8, quantity: additionalQty, storageLocation: 'FREEZER', minStockQty: 0, expiryDate: '2027-01-01' }] })
    assert.deepEqual(original, { id: 8, unit, requiredQty, purchasedQty: previousQty })
  })
}
