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

export const INTAKE_STATUS_LABEL = {
  PLANNED: '먹기 전',
  EATEN: '먹었어요',
  SKIPPED: '건너뛰었어요',
}

export const SHOPPING_ITEM_STATUS_LABEL = {
  NEEDED: '구매 필요',
  PARTIAL: '일부 구매',
  PURCHASED: '구매 완료',
}

export const LOT_STATUS_LABEL = {
  ACTIVE: '보관 중',
  DEPLETED: '다 썼어요',
  DISPOSED: '버렸어요',
}

export const INVENTORY_TRANSACTION_TYPE_LABEL = {
  STOCK_IN: '입고',
  COOK_DEDUCT: '조리 차감',
  COOK_RESTORE: '조리 취소 복원',
  ADJUST: '수량 수정',
  DISPOSE: '폐기',
}
