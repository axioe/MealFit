// 백엔드 enum 값 → 화면에 보여줄 한글

export const MEAL_TYPE_LABEL = {
  BREAKFAST: '아침',
  LUNCH: '점심',
  DINNER: '저녁',
}

export const MEAL_PLAN_STATUS_LABEL = {
  DRAFT: '추천 초안',
  CONFIRMED: '식단 확정',
  CANCELED: '취소됨',
}

export const STORAGE_LABEL = {
  FRIDGE: '냉장',
  FREEZER: '냉동',
  PANTRY: '실온',
}

export const EXPIRATION_LABEL = {
  NORMAL: '정상',
  IMMINENT: '기한 임박',
  TODAY: '오늘 만료',
  EXPIRED: '기한 경과',
  UNKNOWN: '기한 미등록',
}

export const LOT_STATUS_LABEL = {
  ACTIVE: '보관 중',
  DEPLETED: '다 썼어요',
  DISPOSED: '버렸어요',
}
