import test from 'node:test'
import assert from 'node:assert/strict'
import { actualUsageSupport, cookingInventoryOptions, usageBaseline, usageChanged, syncUsageSession, addUsageIngredient, analyzeUsage, prepareActualUsageDraft, canUseDefaultCooking } from '../src/api/actualUsage.js'

const preview = { ingredients: [{ ingredientName: '토마토', requiredQty: 100, unit: 'g' }] }
const baseline = usageBaseline(preview)
const inventory = { asOfDate: '2026-10-22', groups: [
  { ingredientName: '토마토', unit: 'g', lots: [{ id: 1, ingredientName: '토마토', quantity: 500, unit: 'g', status: 'ACTIVE', expirationStatus: 'FRESH' }] },
  { ingredientName: '달걀', unit: '개', lots: [{ id: 2, ingredientName: '달걀', quantity: 6, unit: '개', status: 'ACTIVE', expirationStatus: 'FRESH' }] },
] }
const rows = (patch = {}) => [{ ...baseline[0], ...patch }]
const analyze = (value, stock = inventory) => analyzeUsage(value, baseline, stock, true)

test('현재 서버는 수정 사용량을 지원하지 않는다', () => assert.deepEqual(actualUsageSupport, { preview: false, complete: false }))
test('기본 재료와 수량을 그대로 구성한다', () => { assert.equal(baseline[0].quantity, '100'); assert.equal(usageChanged(rows(), baseline), false) })
test('숫자가 동일한 수량은 변경으로 보지 않는다', () => assert.equal(usageChanged(rows({ quantity: '100.000' }), baseline), false))
test('체크 해제와 재선택은 입력 수량을 보존한다', () => {
  const value = rows({ quantity: '150', enabled: false }); assert.equal(analyze(value).empty, true)
  value[0].enabled = true; assert.equal(value[0].quantity, '150'); assert.equal(analyze(value).dirty, true)
})
test('추가 재료는 현재 냉장고 식별 정보와 연결한다', () => {
  const option = cookingInventoryOptions(inventory)[1]
  const value = addUsageIngredient(rows(), option); value[1].quantity = '1'
  const result = prepareActualUsageDraft({ mealPlanId: 91 }, value, analyze(value))
  assert.deepEqual(result.items[1].inventoryReferences, [{ lotId: 2, unit: '개' }])
  assert.equal(result.items[1].origin, 'inventory'); assert.equal(result.items[1].quantity, '1')
  assert.equal(usageChanged(value.slice(0, 1), baseline), false)
})
test('미사용 원본과 같은 재료도 중복 추가를 거부한다', () => assert.throws(() => addUsageIngredient(rows({ enabled: false }), cookingInventoryOptions(inventory)[0]), /이미/))
test('빈 값·0·음수·정밀도·범위 초과를 거부한다', () => {
  for (const quantity of ['', '0', '-1', '1.0001', '1000000000', 'NaN']) assert.ok(analyze(rows({ quantity })).errors['recipe:0'], quantity)
})
test('소수 세 자리와 보유 수량 이하는 허용한다', () => assert.deepEqual(analyze(rows({ quantity: '0.125' })).errors, {}))
test('보유 수량 초과를 확인한다', () => assert.match(analyze(rows({ quantity: '501' })).errors['recipe:0'], /부족/))
test('개와 g를 임의로 환산하지 않는다', () => {
  const stock = structuredClone(inventory); stock.groups[0].lots[0].unit = '개'
  assert.match(analyze(rows(), stock).errors['recipe:0'], /단위/)
})
test('만료·소진·폐기 재고는 선택 대상에서 제외한다', () => {
  for (const patch of [{ expirationStatus: 'EXPIRED' }, { expiryDate: '2026-10-21' }, { status: 'DEPLETED' }, { status: 'DISPOSED' }]) {
    const stock = structuredClone(inventory); Object.assign(stock.groups[0].lots[0], patch)
    assert.equal(cookingInventoryOptions(stock).some((item) => item.ingredientName === '토마토'), false)
  }
})
test('새로고침된 재고에서 사라진 추가 재료는 검증 실패한다', () => {
  const value = addUsageIngredient(rows(), cookingInventoryOptions(inventory)[1]); value[1].quantity = '1'
  assert.ok(analyze(value, { groups: [inventory.groups[0]] }).errors[value[1].key])
})
test('전부 해제하면 내부 요청 준비도 차단한다', () => { const value = rows({ enabled: false }); assert.equal(prepareActualUsageDraft({}, value, analyze(value)), null) })
test('원복하면 기본 조리만 허용하며 변경·재고 갱신 중에는 차단한다', () => {
  const valid = { ...analyze(rows()), inventoryReady: true, stockChanged: false }
  assert.equal(canUseDefaultCooking(valid), true)
  for (const patch of [{ dirty: true }, { empty: true }, { inventoryReady: false }, { stockChanged: true }]) assert.equal(canUseDefaultCooking({ ...valid, ...patch }), false)
})
test('같은 문맥의 미리보기 재조회는 수정 내용을 보존한다', () => {
  const session = syncUsageSession({ scope: 'a' }, 'a', preview); session.rows[0].quantity = '150'
  assert.equal(syncUsageSession(session, 'a', structuredClone(preview)), session)
})
test('인분·식단·날짜 문맥 변경은 입력을 초기화한다', () => {
  const session = syncUsageSession({ scope: 'a' }, 'a', preview); session.rows[0].quantity = '150'
  const changed = syncUsageSession(session, 'b', null)
  assert.deepEqual(changed.rows, []); assert.equal(syncUsageSession(changed, 'b', preview).rows[0].quantity, '100')
})
test('레시피 기준이 바뀌면 새 기본값으로 복원한다', () => {
  const session = syncUsageSession({ scope: 'a' }, 'a', preview)
  assert.equal(syncUsageSession(session, 'a', { ingredients: [{ ...preview.ingredients[0], requiredQty: 200 }] }).rows[0].quantity, '200')
})
