package com.mealfit.domain.inventory;

/** 재고 묶음 생애주기. 기한 상태(정상/임박 등)는 저장하지 않고 ExpirationStatus로 계산한다. */
public enum LotStatus {
    ACTIVE,
    DEPLETED,
    DISPOSED
}
