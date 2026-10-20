package com.mealfit.domain.cooking;

import com.mealfit.global.common.StatusTransition;

/**
 * 조리 상태: (미조리 = CookingEvent 없음) → 완료 → 복원(취소).
 * 조리 완료 시 이벤트가 COOKED로 생성되고, 취소하면 재고를 원본으로 돌린 뒤 RESTORED가 된다.
 */
public enum CookingStatus implements StatusTransition<CookingStatus> {
    COOKED,
    RESTORED;

    @Override
    public boolean canTransitionTo(CookingStatus next) {
        return this == COOKED && next == RESTORED;
    }
}
