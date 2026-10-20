package com.mealfit.domain.inventory;

/** 재고 변경 이력 유형: 입고 / 조리 차감 / 조리 취소 복원 / 수동 조정 / 폐기 */
public enum InventoryTransactionType {
    STOCK_IN,
    COOK_DEDUCT,
    COOK_RESTORE,
    ADJUST,
    DISPOSE
}
