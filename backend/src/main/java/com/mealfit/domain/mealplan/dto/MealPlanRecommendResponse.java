package com.mealfit.domain.mealplan.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * 날짜별 추천 결과. mealPlans에는 새 초안과 함께 이미 확정되어 유지된 끼니도 들어 있다(아침·점심·저녁 순).
 */
public record MealPlanRecommendResponse(LocalDate planDate, List<MealPlanResponse> mealPlans) {
}
