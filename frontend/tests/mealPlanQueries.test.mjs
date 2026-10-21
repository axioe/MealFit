import test from 'node:test'
import assert from 'node:assert/strict'
import { QueryClient, QueryObserver } from '@tanstack/react-query'
import { mealPlanQueryOptions, refreshMealPlanQueries, validateMealPlanDateResult, visibleMealPlans } from '../src/api/mealPlanQueries.js'
import { queryKeys } from '../src/api/queryKeys.js'

const first = '2026-10-21', second = '2026-10-22'
const plan = (date, id, status = 'DRAFT') => ({ id, planDate: date, mealType: 'BREAKFAST', status })
const result = (date, plans = []) => ({ planDate: date, mealPlans: plans })
const client = () => new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } })
const ready = { isFetching: false, isError: false }
const deferred = () => { let resolve; const promise = new Promise((done) => { resolve = done }); return { promise, resolve } }

test('빈 날짜는 빈 목록을 서버에서 조회한다', async () => {
  const cache = client()
  const options = mealPlanQueryOptions(first, async (date) => result(date))
  assert.deepEqual(await cache.fetchQuery(options), result(first))
  assert.equal(options.enabled, true)
  assert.equal(mealPlanQueryOptions('2026-02-30', async () => {}).enabled, false)
  cache.clear()
})
test('초안과 확정 식단을 서버 상태 그대로 표시한다', async () => {
  const cache = client()
  const response = result(first, [plan(first, 1), { ...plan(first, 2, 'CONFIRMED'), mealType: 'LUNCH', cooked: true }])
  const data = await cache.fetchQuery(mealPlanQueryOptions(first, async () => response))
  assert.deepEqual(visibleMealPlans(data, first, ready), response.mealPlans)
  cache.clear()
})
test('날짜·취소 정책이 맞지 않는 응답은 화면 데이터로 수용하지 않는다', () => {
  for (const response of [result(second), result(first, [plan(second, 9)]), result(first, [plan(first, 1, 'CANCELED')])]) {
    assert.throws(() => validateMealPlanDateResult(response, first))
  }
})
test('날짜를 왕복해도 해당 날짜의 서버 식단 ID를 유지한다', async () => {
  const cache = client()
  const get = async (date) => result(date, [plan(date, date === first ? 1 : 2, 'CONFIRMED')])
  await cache.fetchQuery(mealPlanQueryOptions(first, get))
  await cache.fetchQuery(mealPlanQueryOptions(second, get))
  const restored = await cache.fetchQuery(mealPlanQueryOptions(first, get))
  assert.equal(restored.mealPlans[0].id, 1)
  assert.equal(cache.getQueryData(queryKeys.mealPlans.byDate(second)).mealPlans[0].id, 2)
  cache.clear()
})
test('늦게 도착한 이전 날짜 응답이 다음 날짜 캐시를 덮어쓰지 않는다', async () => {
  const cache = client(), slow = deferred()
  const pending = cache.fetchQuery(mealPlanQueryOptions(first, () => slow.promise))
  await cache.fetchQuery(mealPlanQueryOptions(second, async () => result(second, [plan(second, 2)])))
  slow.resolve(result(first, [plan(first, 1)]))
  await pending
  assert.equal(cache.getQueryData(queryKeys.mealPlans.byDate(second)).mealPlans[0].id, 2)
  assert.deepEqual(visibleMealPlans(cache.getQueryData(queryKeys.mealPlans.byDate(first)), second, ready), [])
  cache.clear()
})
test('이전 날짜 요청 취소 신호가 전달되고 취소된 응답은 저장되지 않는다', async () => {
  const cache = client(), slow = deferred()
  let signal
  const pending = cache.fetchQuery(mealPlanQueryOptions(first, (_date, inputSignal) => { signal = inputSignal; return slow.promise })).catch(() => undefined)
  await cache.cancelQueries({ queryKey: queryKeys.mealPlans.byDate(first), exact: true })
  assert.equal(signal.aborted, true)
  slow.resolve(result(first, [plan(first, 1)]))
  await pending
  assert.equal(cache.getQueryData(queryKeys.mealPlans.byDate(first)), undefined)
  cache.clear()
})
test('같은 날짜의 동시 조회는 한 요청으로 공유한다', async () => {
  const cache = client(), slow = deferred()
  let count = 0
  const options = mealPlanQueryOptions(first, () => { count++; return slow.promise })
  const left = cache.fetchQuery(options), right = cache.fetchQuery(options)
  slow.resolve(result(first))
  await Promise.all([left, right])
  assert.equal(count, 1)
  cache.clear()
})
for (const action of ['confirm', 'cancel', 'regenerate', 'recommend']) {
  test(`${action} 후 해당 날짜만 서버에서 다시 조회한다`, async () => {
    const cache = client()
    let server = result(first, [plan(first, 1)])
    let count = 0
    const options = mealPlanQueryOptions(first, async () => { count++; return structuredClone(server) })
    const observer = new QueryObserver(cache, options)
    const unsubscribe = observer.subscribe(() => {})
    try {
      await observer.refetch({ cancelRefetch: false })
      cache.setQueryData(queryKeys.mealPlans.byDate(second), result(second, [plan(second, 9)]))
      cache.setQueryData(queryKeys.shopping.all, [])
      server = result(first, action === 'cancel' ? [] : [plan(first, action === 'regenerate' || action === 'recommend' ? 2 : 1, action === 'confirm' ? 'CONFIRMED' : 'DRAFT')])
      await refreshMealPlanQueries(cache, { date: first, action })
      assert.equal(count, 2)
      assert.deepEqual(cache.getQueryData(queryKeys.mealPlans.byDate(first)), server)
      assert.equal(cache.getQueryState(queryKeys.mealPlans.byDate(second)).isInvalidated, false)
      assert.equal(cache.getQueryState(queryKeys.shopping.all).isInvalidated, action === 'confirm' || action === 'cancel')
    } finally { unsubscribe(); cache.clear() }
  })
}
test('재조회 중·오류 시 오래된 확정 상태를 숨기고 재시도하면 최신 결과를 사용한다', async () => {
  const cache = client()
  const old = result(first, [plan(first, 1, 'CONFIRMED')])
  cache.setQueryData(queryKeys.mealPlans.byDate(first), old)
  assert.deepEqual(visibleMealPlans(old, first, { ...ready, isFetching: true }), [])
  await assert.rejects(cache.fetchQuery(mealPlanQueryOptions(first, async () => { throw new Error('서버 오류') })))
  assert.deepEqual(visibleMealPlans(old, first, { ...ready, isError: true }), [])
  const fresh = await cache.fetchQuery(mealPlanQueryOptions(first, async () => result(first)))
  assert.deepEqual(visibleMealPlans(fresh, first, ready), [])
  cache.clear()
})
test('새 캐시에서도 세션 초기값 없이 서버에서 복원한다', async () => {
  const cache = client()
  let count = 0
  const options = mealPlanQueryOptions(first, async () => { count++; return result(first, [plan(first, 7, 'CONFIRMED')]) })
  assert.equal('initialData' in options, false)
  assert.equal((await cache.fetchQuery(options)).mealPlans[0].id, 7)
  assert.equal(count, 1)
  cache.clear()
})
