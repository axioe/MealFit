package com.mealfit.domain.mealplan.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.time.LocalDate;

/**
 * @param planDate 추천받을 날짜
 * @param servings 끼니당 인분. 없으면 1인분
 */
public record MealPlanRecommendRequest(
        @NotNull(message = "날짜를 선택해 주세요.") LocalDate planDate,
        @Positive(message = "인분은 1 이상이어야 합니다.") @Max(value = 10, message = "인분은 10 이하로 입력해 주세요.")
        Integer servings
) {

    public int servingsOrDefault() {
        return servings != null ? servings : 1;
    }
}
