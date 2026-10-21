package com.mealfit.domain.mealplan.dto;

import com.mealfit.domain.mealplan.MealPlan;
import com.mealfit.domain.mealplan.MealPlanStatus;
import com.mealfit.domain.mealplan.MealType;
import com.mealfit.domain.recipe.Recipe;
import com.mealfit.domain.recipe.RecipeSource;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 식단 한 끼. recipe.source로 "AI 생성 / 검증된 로컬 대체" 배지를 표시한다.
 *
 * @param cooked 조리 완료(재고 차감) 상태인지. 조리 기록이 없거나 취소(복원)했으면 false
 */
public record MealPlanResponse(
        Long id,
        LocalDate planDate,
        MealType mealType,
        MealPlanStatus status,
        int servings,
        String recommendationReason,
        RecipeSummary recipe,
        boolean cooked
) {

    public record RecipeSummary(Long id, String name, int cookTimeMin, BigDecimal calories,
                                boolean nutritionEstimated, RecipeSource source) {

        static RecipeSummary from(Recipe recipe) {
            return new RecipeSummary(recipe.getId(), recipe.getName(), recipe.getCookTimeMin(),
                    recipe.getCalories(), recipe.isNutritionEstimated(), recipe.getSource());
        }
    }

    /** 조리 전 식단(초안·방금 확정·취소)용 */
    public static MealPlanResponse from(MealPlan plan) {
        return from(plan, false);
    }

    public static MealPlanResponse from(MealPlan plan, boolean cooked) {
        return new MealPlanResponse(plan.getId(), plan.getPlanDate(), plan.getMealType(), plan.getStatus(),
                plan.getServings(), plan.getRecommendationReason(), RecipeSummary.from(plan.getRecipe()), cooked);
    }
}
