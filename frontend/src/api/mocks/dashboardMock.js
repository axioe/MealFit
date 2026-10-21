/**
 * [임시] 아직 API가 없는 대시보드 영역의 예시 데이터. 응답 모양은 src/api/dashboard.js의 주석과 같다.
 * 각 영역의 API가 완성되면 dashboard.js의 MOCK 값을 false로 바꾸고, 여기서 해당 함수를 지운다.
 * 섭취·운동 완료·컨디션 기록은 메모리에만 저장되므로 새로고침하면 처음 상태로 돌아간다.
 */
import { formatWeekday } from '@/lib/date'
import { INTAKE_STATUS, MEAL_PLAN_STATUS, MEAL_TYPE, RECIPE_SOURCE } from '@/lib/enums'

const MOCK_DELAY_MS = 300
const wait = (ms = MOCK_DELAY_MS) => new Promise((resolve) => setTimeout(resolve, ms))

// 레시피 id·이름은 V2__seed_fallback_recipes.sql의 대체 레시피와 맞춰 레시피 상세 링크가 실제로 열리게 한다
function buildMeals(date) {
  return [
    {
      id: 101,
      planDate: date,
      mealType: MEAL_TYPE.BREAKFAST,
      status: MEAL_PLAN_STATUS.CONFIRMED,
      servings: 1,
      recommendationReason: '냉장고에 있는 달걀과 식빵을 먼저 쓰는 메뉴예요.',
      recipe: { id: 1, name: '달걀 토스트', cookTimeMin: 10, calories: 380, nutritionEstimated: true, source: RECIPE_SOURCE.LOCAL_FALLBACK },
      intakeStatus: INTAKE_STATUS.EATEN,
    },
    {
      id: 102,
      planDate: date,
      mealType: MEAL_TYPE.LUNCH,
      status: MEAL_PLAN_STATUS.CONFIRMED,
      servings: 1,
      recommendationReason: '단백질 목표에 맞춰 닭가슴살을 넣었어요.',
      recipe: { id: 4, name: '닭가슴살 샐러드', cookTimeMin: 15, calories: 350, nutritionEstimated: true, source: RECIPE_SOURCE.AI_GENERATED },
      intakeStatus: INTAKE_STATUS.PLANNED,
    },
    {
      id: 103,
      planDate: date,
      mealType: MEAL_TYPE.DINNER,
      status: MEAL_PLAN_STATUS.DRAFT,
      servings: 2,
      recommendationReason: '기한이 임박한 두부를 쓰는 메뉴예요.',
      recipe: { id: 8, name: '두부 된장찌개', cookTimeMin: 25, calories: 280, nutritionEstimated: true, source: RECIPE_SOURCE.AI_GENERATED },
      intakeStatus: null,
    },
  ]
}

const mealsByDate = new Map()
const workoutDoneByDate = new Map()
let latestCoaching = null

function coachingFor({ sleepHours, fatigue, soreness, availableMinutes }) {
  const tired = fatigue === 'HIGH' || sleepHours <= 5
  const sore = soreness !== 'NONE'
  const minutes = tired ? Math.min(availableMinutes, 20) : availableMinutes
  const workout = tired
    ? `가벼운 스트레칭과 걷기 ${minutes}분`
    : sore
      ? `통증 부위를 피한 상체 위주 근력 운동 ${minutes}분`
      : `하체 근력 & 둔근 강화 ${minutes}분`
  const meal = tired ? '소화가 편하고 단백질이 충분한 식단' : '근력 운동에 맞춘 고단백 식단'
  return {
    summary: tired ? '오늘은 회복이 우선이에요. 강도를 낮추고 충분히 쉬어 주세요.' : '컨디션이 좋아요. 계획한 루틴을 그대로 진행해도 좋아요.',
    workout,
    meal,
  }
}

export const dashboardMock = {
  async getMeals(date) {
    await wait()
    if (!mealsByDate.has(date)) mealsByDate.set(date, buildMeals(date))
    return structuredClone(mealsByDate.get(date))
  },

  async recordIntake({ mealPlanId, intakeStatus }) {
    await wait()
    for (const meals of mealsByDate.values()) {
      const meal = meals.find((m) => m.id === mealPlanId)
      if (meal) {
        meal.intakeStatus = intakeStatus
        return { id: mealPlanId, mealPlanId, intakeStatus, loggedAt: new Date().toISOString() }
      }
    }
    throw new Error('식단을 찾을 수 없습니다.')
  },

  async getProfile() {
    await wait()
    return { nickname: '건강지킴이', goal: 'LOSE', targetWeightKg: 68 }
  },

  async getTodayWorkout(date) {
    await wait()
    return {
      date,
      dayLabel: `${formatWeekday(date)} 운동일`,
      focus: '하체 근력 (근성장 루틴)',
      title: '하체 근력 & 둔근 강화 (월요일 상체 후 48시간 간격 준수)',
      totalMinutes: 30,
      exercises: [
        { name: '맨몸 고블릿 스쿼트', sets: 3, reps: '12~15회' },
        { name: '글루트 브릿지 (엉덩이 들기)', sets: 3, reps: '15~20회' },
        { name: '스탠딩 카프 레이즈 (종아리 들기)', sets: 3, reps: '20회' },
      ],
      completed: workoutDoneByDate.get(date) ?? false,
    }
  },

  async setWorkoutCompleted({ date, completed }) {
    await wait(150)
    workoutDoneByDate.set(date, completed)
    return { date, completed }
  },

  async getWeightSummary() {
    await wait()
    return { currentKg: 74.5, targetKg: 68, measuredAt: null }
  },

  async getCoaching() {
    await wait(100)
    return latestCoaching
  },

  async checkCondition(condition) {
    await wait(800)
    latestCoaching = { condition, ...coachingFor(condition), checkedAt: new Date().toISOString() }
    return latestCoaching
  },
}
