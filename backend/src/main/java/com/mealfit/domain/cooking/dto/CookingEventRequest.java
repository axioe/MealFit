package com.mealfit.domain.cooking.dto;

import jakarta.validation.constraints.NotNull;

/** 조리 완료. 인분은 식단(meal_plans.servings)을 따른다. */
public record CookingEventRequest(
        @NotNull(message = "조리할 식단을 선택해 주세요.") Long mealPlanId
) {
}
