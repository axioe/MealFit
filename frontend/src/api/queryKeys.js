/**
 * TanStack Query 키 모음. 도메인 담당자가 여기에 키를 추가하고,
 * 데이터를 바꾸는 mutation 후에는 관련 키를 invalidate 한다.
 * 예) 조리 완료 → inventory, mealPlans, dashboard 무효화
 */
export const queryKeys = {
  auth: {
    // 회원 간 인증 조회 캐시를 분리합니다.
    me: (userId) => ['auth', 'me', userId ?? null],
  },
  dashboard: {
    all: ['dashboard'],
    byDate: (date) => ['dashboard', date],
    profile: ['dashboard', 'profile'],
    workout: (date) => ['dashboard', 'workout', date],
    weight: ['dashboard', 'weight'],
    coaching: ['dashboard', 'coaching'],
  },
  inventory: {
    all: ['inventory'],
    transactions: (lotId) => ['inventory', 'transactions', lotId ?? 'all'],
  },
  mealPlans: {
    all: ['mealPlans'],
    byDate: (date) => ['mealPlans', date],
  },
  recipes: {
    detail: (id, servings) => ['recipes', id, servings],
  },
  shopping: {
    all: ['shopping'],
  },
}
