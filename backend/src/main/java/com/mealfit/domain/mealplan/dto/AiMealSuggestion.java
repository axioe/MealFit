package com.mealfit.domain.mealplan.dto;

import com.mealfit.domain.mealplan.MealType;
import java.math.BigDecimal;
import java.util.List;

/** AI → Spring 끼니별 추천 (초안 계약, AI 담당자와 함께 확정). 영양 정보는 항상 추정치로 저장한다. */
public record AiMealSuggestion(
        MealType mealType,
        String recipeName,
        String description,
        Integer servingSize,
        Integer cookTimeMin,
        BigDecimal calories,
        BigDecimal proteinG,
        BigDecimal carbsG,
        BigDecimal fatG,
        List<Ingredient> ingredients,
        List<String> steps,
        String reason
) {

    public record Ingredient(String name, BigDecimal quantity, String unit) {
    }
}
