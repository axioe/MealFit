import type { Goal } from '@/types/api'
import type { ExpirationStatus, MealPlanStatus, MealType, StorageLocation } from '@/types/domain'

export const GOAL_LABEL: Record<Goal, string> = {
  LOSS: '체중 감량',
  MAINTAIN: '체중 유지',
  GAIN: '체중 증량',
}

export const MEAL_TYPE_LABEL: Record<MealType, string> = {
  BREAKFAST: '아침',
  LUNCH: '점심',
  DINNER: '저녁',
}

export const MEAL_PLAN_STATUS_LABEL: Record<MealPlanStatus, string> = {
  DRAFT: '추천 초안',
  CONFIRMED: '식단 확정',
  CANCELED: '취소됨',
}

export const STORAGE_LABEL: Record<StorageLocation, string> = {
  FRIDGE: '냉장',
  FREEZER: '냉동',
  PANTRY: '실온',
}

export const EXPIRATION_LABEL: Record<ExpirationStatus, string> = {
  NORMAL: '정상',
  IMMINENT: '기한 임박',
  TODAY: '오늘 만료',
  EXPIRED: '기한 경과',
  UNKNOWN: '기한 미등록',
}
