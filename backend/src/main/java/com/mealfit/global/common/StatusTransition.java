package com.mealfit.global.common;

import com.mealfit.global.exception.BusinessException;
import com.mealfit.global.exception.ErrorCode;

/**
 * 상태 enum 공통 규칙. 허용된 전이만 서비스 계층에서 통과시킨다.
 * 사용: {@code plan.getStatus().validateTransition(MealPlanStatus.CONFIRMED);}
 */
public interface StatusTransition<S extends Enum<S> & StatusTransition<S>> {

    boolean canTransitionTo(S next);

    default void validateTransition(S next) {
        if (!canTransitionTo(next)) {
            throw new BusinessException(ErrorCode.INVALID_STATUS_TRANSITION,
                    "상태를 %s에서 %s(으)로 바꿀 수 없습니다.".formatted(this, next.name()));
        }
    }
}
