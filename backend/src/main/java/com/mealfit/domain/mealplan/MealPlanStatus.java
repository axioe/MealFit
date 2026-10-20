package com.mealfit.domain.mealplan;

import com.mealfit.global.common.StatusTransition;

/** 식단 상태: 초안 → 확정 → 취소 (초안에서 바로 취소도 가능) */
public enum MealPlanStatus implements StatusTransition<MealPlanStatus> {
    DRAFT,
    CONFIRMED,
    CANCELED;

    @Override
    public boolean canTransitionTo(MealPlanStatus next) {
        return switch (this) {
            case DRAFT -> next == CONFIRMED || next == CANCELED;
            case CONFIRMED -> next == CANCELED;
            case CANCELED -> false;
        };
    }
}
