/**
 * TanStack Query 키 모음. 도메인 담당자가 여기에 키를 추가하고,
 * 데이터를 바꾸는 mutation 후에는 관련 키를 invalidate 한다.
 * 예) 조리 완료 → inventory, mealPlans, dashboard 무효화
 */
export const queryKeys = {
  me: {
    all: ['me'] as const,
    profile: ['me', 'profile'] as const,
  },
  dashboard: (date: string) => ['dashboard', date] as const,
  inventory: {
    all: ['inventory'] as const,
  },
  mealPlans: {
    all: ['mealPlans'] as const,
    byDate: (date: string) => ['mealPlans', date] as const,
  },
  recipes: {
    detail: (id: number, servings?: number) => ['recipes', id, servings] as const,
  },
  shopping: {
    all: ['shopping'] as const,
  },
}
