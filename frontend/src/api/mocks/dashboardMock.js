/**
 * [임시] 대시보드 API가 완성되기 전까지 쓰는 예시 데이터.
 * 응답 모양은 src/api/dashboard.js의 "응답 형식"과 같다. 실제 API로 바꾸면 이 파일은 지운다.
 * 섭취 기록은 메모리에만 저장되므로 새로고침하면 처음 상태로 돌아간다.
 */
import { addDays } from '@/lib/date'
import {
  EXPIRATION_STATUS,
  INTAKE_STATUS,
  LOT_STATUS,
  MEAL_PLAN_STATUS,
  MEAL_TYPE,
  RECIPE_SOURCE,
  SHOPPING_ITEM_STATUS,
  STORAGE_LOCATION,
} from '@/lib/enums'

const MOCK_DELAY_MS = 300
const dashboards = new Map()

const wait = () => new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS))

// 레시피 id·이름은 V2__seed_fallback_recipes.sql의 대체 레시피와 맞춰 레시피 상세 링크가 실제로 열리게 한다
function buildDashboard(date) {
  return {
    date,
    meals: [
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
    ],
    expiringLots: [
      { id: 11, ingredientName: '두부', quantity: 1, unit: '모', expiryDate: date, storageLocation: STORAGE_LOCATION.FRIDGE, status: LOT_STATUS.ACTIVE, expirationStatus: EXPIRATION_STATUS.TODAY },
      { id: 12, ingredientName: '우유', quantity: 500, unit: 'ml', expiryDate: addDays(date, 2), storageLocation: STORAGE_LOCATION.FRIDGE, status: LOT_STATUS.ACTIVE, expirationStatus: EXPIRATION_STATUS.IMMINENT },
      { id: 13, ingredientName: '양상추', quantity: 80, unit: 'g', expiryDate: addDays(date, -1), storageLocation: STORAGE_LOCATION.FRIDGE, status: LOT_STATUS.ACTIVE, expirationStatus: EXPIRATION_STATUS.EXPIRED },
    ],
    shortages: [
      { id: 21, ingredientName: '닭가슴살', requiredQty: 200, purchasedQty: 0, unit: 'g', status: SHOPPING_ITEM_STATUS.NEEDED },
      { id: 22, ingredientName: '애호박', requiredQty: 1, purchasedQty: 0, unit: '개', status: SHOPPING_ITEM_STATUS.NEEDED },
      { id: 23, ingredientName: '달걀', requiredQty: 10, purchasedQty: 4, unit: '개', status: SHOPPING_ITEM_STATUS.PARTIAL },
    ],
  }
}

function getOrCreate(date) {
  if (!dashboards.has(date)) dashboards.set(date, buildDashboard(date))
  return dashboards.get(date)
}

export const dashboardMock = {
  async getDashboard(date) {
    await wait()
    return structuredClone(getOrCreate(date))
  },

  async recordIntake({ mealPlanId, intakeStatus }) {
    await wait()
    for (const dashboard of dashboards.values()) {
      const meal = dashboard.meals.find((m) => m.id === mealPlanId)
      if (meal) {
        meal.intakeStatus = intakeStatus
        return { id: mealPlanId, mealPlanId, intakeStatus, loggedAt: new Date().toISOString() }
      }
    }
    throw new Error('식단을 찾을 수 없습니다.')
  },
}
