package com.mealfit.domain.intake;

import com.mealfit.global.common.StatusTransition;

/** 섭취 상태: 예정 → 먹음/건너뜀 (먹음 ↔ 건너뜀 정정 허용) */
public enum IntakeStatus implements StatusTransition<IntakeStatus> {
    PLANNED,
    EATEN,
    SKIPPED;

    @Override
    public boolean canTransitionTo(IntakeStatus next) {
        return next != PLANNED && next != this;
    }
}
