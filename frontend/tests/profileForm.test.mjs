import test from 'node:test'
import assert from 'node:assert/strict'
import { buildProfileSectionBody, createProfileForm, parseProfileItems } from '../src/lib/profileForm.js'

function details() {
  return {
    body: { nickname: '회원', age: 30, height: 175.5, currentWeight: 70, targetWeight: 65 },
    trainer: { age: 30, height: 175.5, currentWeight: 70, workoutGoal: 'health', workoutLevel: 'starter',
      equipment: ['none'], injuries: ['허리'], allergies: ['우유'], excludedIngredients: ['고수'] },
    diet: { goal: 'LOSE', allergies: ['우유'], excludedIngredients: ['고수'], preferredFoods: ['두부'], prioritizeFridge: false },
    fitness: { workoutGoal: 'health', workoutLevel: 'starter', equipment: ['none'], injuries: ['허리'] },
    tests: { pushups: 0 },
  }
}

test('공유 데이터가 모든 탭 입력에 동일하게 표시된다', () => {
  const form = createProfileForm(details())
  assert.equal(form.age, form.trainerAge)
  assert.equal(form.height, form.trainerHeight)
  assert.equal(form.fitnessGoal, form.trainerGoal)
  assert.equal(form.experience, form.trainerLevel)
  assert.deepEqual(form.equipment, form.trainerEquipment)
  assert.equal(form.allergiesText, form.trainerAllergiesText)
  assert.equal(form.dietGoal, 'loss')
})

test('측정값 0을 유지하고 빈칸은 null로 전송한다', () => {
  const form = createProfileForm(details())
  const body = buildProfileSectionBody('tests', form)
  assert.equal(body.pushups, 0)
  assert.equal(body.plankSeconds, null)
  assert.equal(body.restingHeartRate, null)
  assert.equal(body.squat30s, null)
})

test('식단 목표 변환과 선택 항목 해제, 재료 정규화를 처리한다', () => {
  const form = createProfileForm(details())
  form.allergiesText = ' 우유, 땅콩,우유,, '
  form.dislikedFoodsText = ''
  form.preferredFoodsText = ''
  const body = buildProfileSectionBody('diet', form)
  assert.equal(body.goal, 'LOSE')
  assert.equal(body.cookTimeMin, null)
  assert.equal(body.defaultServings, null)
  assert.deepEqual(body.allergies, ['우유', '땅콩'])
  assert.deepEqual(body.excludedIngredients, [])
  assert.deepEqual(body.preferredFoods, [])
  assert.equal(body.prioritizeFridge, false)
})

test('각 탭은 담당 필드만 전송하고 신체 소수점 값을 보존한다', () => {
  const form = createProfileForm(details())
  form.height = '175.5'
  const common = buildProfileSectionBody('common', form)
  assert.equal(common.height, 175.5)
  assert.equal(Object.hasOwn(common, 'equipment'), false)
  const fitness = buildProfileSectionBody('fitness', form)
  assert.equal(Object.hasOwn(fitness, 'nickname'), false)
  assert.equal(Object.hasOwn(fitness, 'allergies'), false)
  assert.equal(fitness.workoutMinutes, null)
})

test('트레이너 필수 선택을 확인하고 잘못된 탭은 전송하지 않는다', () => {
  const form = createProfileForm(details())
  form.trainerGoal = ''
  assert.throws(() => buildProfileSectionBody('trainer', form), /운동 목적/)
  assert.throws(() => buildProfileSectionBody('unknown', form), /저장할 탭/)
  assert.deepEqual(parseProfileItems(''), [])
})
