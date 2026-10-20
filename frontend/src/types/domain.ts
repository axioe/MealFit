// 백엔드 enum과 같은 값을 쓴다 (backend: domain/**/*Status.java 등).
// 각 도메인 담당자가 API를 만들면서 응답 타입을 이 파일 또는 도메인별 파일에 추가한다.

export type StorageLocation = 'FRIDGE' | 'FREEZER' | 'PANTRY'
export type LotStatus = 'ACTIVE' | 'DEPLETED' | 'DISPOSED'
export type ExpirationStatus = 'NORMAL' | 'IMMINENT' | 'TODAY' | 'EXPIRED' | 'UNKNOWN'
export type InventoryTransactionType = 'STOCK_IN' | 'COOK_DEDUCT' | 'COOK_RESTORE' | 'ADJUST' | 'DISPOSE'

export type ShoppingItemStatus = 'NEEDED' | 'PARTIAL' | 'PURCHASED'

export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER'
export type MealPlanStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELED'
export type CookingStatus = 'COOKED' | 'RESTORED'
export type IntakeStatus = 'PLANNED' | 'EATEN' | 'SKIPPED'

/** AI 생성 / 검증된 로컬 대체 / 시드 */
export type RecipeSource = 'AI_GENERATED' | 'LOCAL_FALLBACK' | 'SEED'
