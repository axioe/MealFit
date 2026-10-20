// 백엔드 enum과 같은 값을 쓴다 (backend: domain/**/*Status.java 등).
// 문자열을 직접 쓰지 말고 MEAL_PLAN_STATUS.CONFIRMED 처럼 이 상수를 쓴다 (오타 방지).

export const STORAGE_LOCATION = Object.freeze({ FRIDGE: 'FRIDGE', FREEZER: 'FREEZER', PANTRY: 'PANTRY' })
export const LOT_STATUS = Object.freeze({ ACTIVE: 'ACTIVE', DEPLETED: 'DEPLETED', DISPOSED: 'DISPOSED' })
export const EXPIRATION_STATUS = Object.freeze({
  NORMAL: 'NORMAL',
  IMMINENT: 'IMMINENT',
  TODAY: 'TODAY',
  EXPIRED: 'EXPIRED',
  UNKNOWN: 'UNKNOWN',
})
export const INVENTORY_TRANSACTION_TYPE = Object.freeze({
  STOCK_IN: 'STOCK_IN',
  COOK_DEDUCT: 'COOK_DEDUCT',
  COOK_RESTORE: 'COOK_RESTORE',
  ADJUST: 'ADJUST',
  DISPOSE: 'DISPOSE',
})

export const SHOPPING_ITEM_STATUS = Object.freeze({ NEEDED: 'NEEDED', PARTIAL: 'PARTIAL', PURCHASED: 'PURCHASED' })

export const MEAL_TYPE = Object.freeze({ BREAKFAST: 'BREAKFAST', LUNCH: 'LUNCH', DINNER: 'DINNER' })
export const MEAL_PLAN_STATUS = Object.freeze({ DRAFT: 'DRAFT', CONFIRMED: 'CONFIRMED', CANCELED: 'CANCELED' })
export const COOKING_STATUS = Object.freeze({ COOKED: 'COOKED', RESTORED: 'RESTORED' })
export const INTAKE_STATUS = Object.freeze({ PLANNED: 'PLANNED', EATEN: 'EATEN', SKIPPED: 'SKIPPED' })

/** AI 생성 / 검증된 로컬 대체 / 시드 */
export const RECIPE_SOURCE = Object.freeze({
  AI_GENERATED: 'AI_GENERATED',
  LOCAL_FALLBACK: 'LOCAL_FALLBACK',
  SEED: 'SEED',
})
