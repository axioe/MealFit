import test from 'node:test'
import assert from 'node:assert/strict'
import { requestWithdrawal, clearWithdrawalSession } from '../src/api/withdrawalFlow.js'

function cleanupOptions(events) {
  return {
    isCurrentSession: () => true,
    navigate: async (path, options) => { events.push(['navigate', path, options]) },
    cancelQueries: async () => { events.push('cancel') },
    clearSession: () => { events.push('session') },
    clearCache: () => { events.push('cache') },
  }
}

test('확인한 비밀번호를 공백 변경 없이 DELETE 본문으로 전달한다', async () => {
  const calls = []
  const client = { delete: async (...args) => { calls.push(args) } }
  await requestWithdrawal(client, ' password ', true)
  assert.deepEqual(calls, [['/me', { data: { password: ' password ' } }]])
})

test('비밀번호·최종 확인·바이트 길이가 올바르지 않으면 요청하지 않는다', async () => {
  let called = 0
  const client = { delete: async () => { called++ } }
  for (const [password, confirmed] of [['', true], [' ', true], ['password', false], ['한'.repeat(25), true]]) {
    await assert.rejects(requestWithdrawal(client, password, confirmed))
  }
  assert.equal(called, 0)
  await requestWithdrawal(client, '한'.repeat(24), true)
  assert.equal(called, 1)
})

test('비밀번호 오류에서는 로그인 정보와 캐시를 지우지 않는다', async () => {
  const events = []
  const failure = { response: { status: 400, data: { code: 'USER_001' } } }
  const client = { delete: async () => { throw failure } }
  await assert.rejects(async () => {
    await requestWithdrawal(client, 'wrong', true)
    await clearWithdrawalSession(cleanupOptions(events))
  }, error => error === failure)
  assert.deepEqual(events, [])
})

test('통신 실패도 성공으로 처리하거나 로컬 세션을 지우지 않는다', async () => {
  const events = []
  const client = { delete: async () => { throw new Error('network') } }
  await assert.rejects(async () => {
    await requestWithdrawal(client, 'password', true)
    await clearWithdrawalSession(cleanupOptions(events))
  }, /network/)
  assert.deepEqual(events, [])
})

test('성공 시 공개 화면으로 이동하고 요청 취소 후 세션과 캐시를 지운다', async () => {
  const events = []
  await requestWithdrawal({ delete: async () => { events.push('server') } }, 'password', true)
  await clearWithdrawalSession(cleanupOptions(events))
  assert.deepEqual(events, [
    'server', ['navigate', '/login', { replace: true, state: { withdrawn: true } }],
    'cancel', 'session', 'cache',
  ])
})

test('조회 취소에 실패해도 탈퇴한 회원의 세션은 남기지 않는다', async () => {
  const events = []
  const options = cleanupOptions(events)
  options.cancelQueries = async () => { throw new Error('cancel failed') }
  await assert.rejects(clearWithdrawalSession(options), /cancel failed/)
  assert.deepEqual(events.slice(-2), ['session', 'cache'])
})

test('화면 이동에 실패해도 탈퇴한 회원의 세션과 캐시는 정리한다', async () => {
  const events = []
  const options = cleanupOptions(events)
  options.navigate = async () => { throw new Error('navigate failed') }
  await assert.rejects(clearWithdrawalSession(options), /navigate failed/)
  assert.deepEqual(events, ['cancel', 'session', 'cache'])
})

test('다른 계정으로 바뀌면 새 계정의 로그인 정보와 캐시를 유지한다', async () => {
  const events = []
  const options = cleanupOptions(events)
  options.isCurrentSession = () => false
  await clearWithdrawalSession(options)
  assert.deepEqual(events, [])

  let sameUser = true
  options.isCurrentSession = () => sameUser
  options.cancelQueries = async () => { sameUser = false }
  await clearWithdrawalSession(options)
  assert.equal(events.length, 1)
  assert.equal(events[0][0], 'navigate')
})
