package com.mealfit.domain.mealplan.dto;

import com.mealfit.domain.mealplan.MealPlan;
import com.mealfit.domain.mealplan.MealPlanStatus;
import com.mealfit.domain.mealplan.MealType;
import com.mealfit.domain.recipe.Recipe;
import com.mealfit.domain.recipe.RecipeSource;
import java.math.BigDecimal;
import java.time.LocalDate;

/** 식단 한 끼. recipe.source로 "AI 생성 / 검증된 로컬 대체" 배지를 표시한다. */
public record MealPlanResponse(
        Long id,
        LocalDate planDate,
        MealType mealType,
        MealPlanStatus status,
        int servings,
        String recommendationReason,
        RecipeSummary recipe
) {

    public record RecipeSummary(Long id, String name, int cookTimeMin, BigDecimal calories,
                                boolean nutritionEstimated, RecipeSource source) {

        static RecipeSummary from(Recipe recipe) {
            return new RecipeSummary(recipe.getId(), recipe.getName(), recipe.getCookTimeMin(),
                    recipe.getCalories(), recipe.isNutritionEstimated(), recipe.getSource());
        }
    }

    public static MealPlanResponse from(MealPlan plan) {
        return new MealPlanResponse(plan.getId(), plan.getPlanDate(), plan.getMealType(), plan.getStatus(),
                plan.getServings(), plan.getRecommendationReason(), RecipeSummary.from(plan.getRecipe()));
    }
}
