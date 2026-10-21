package com.mealfit.domain.mealplan;

import com.mealfit.domain.mealplan.dto.AiMealSuggestion;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.Set;

/**
 * AI 제안의 서버 검증. 형식이 잘못되었거나 제한 재료가 들어 있으면 그 끼니는 로컬 대체로 바꾼다.
 * 문제가 없으면 Optional.empty(), 있으면 사유를 돌려준다.
 */
public final class AiSuggestionValidator {

    private static final BigDecimal MAX_QUANTITY = new BigDecimal("100000");

    private AiSuggestionValidator() {
    }

    public static Optional<String> validate(AiMealSuggestion suggestion, Set<String> restricted) {
        if (isBlank(suggestion.recipeName(), 100)) {
            return Optional.of("메뉴명 누락");
        }
        if (suggestion.servingSize() == null || suggestion.servingSize() < 1 || suggestion.servingSize() > 20) {
            return Optional.of("기준 인분 비정상");
        }
        if (suggestion.cookTimeMin() == null || suggestion.cookTimeMin() < 1 || suggestion.cookTimeMin() > 300) {
            return Optional.of("조리 시간 비정상");
        }
        if (isNegative(suggestion.calories()) || isNegative(suggestion.proteinG())
                || isNegative(suggestion.carbsG()) || isNegative(suggestion.fatG())) {
            return Optional.of("영양 정보 비정상");
        }
        List<AiMealSuggestion.Ingredient> ingredients = suggestion.ingredients();
        if (ingredients == null || ingredients.isEmpty()) {
            return Optional.of("재료 누락");
        }
        for (AiMealSuggestion.Ingredient ingredient : ingredients) {
            if (ingredient == null || isBlank(ingredient.name(), 100) || isBlank(ingredient.unit(), 20)) {
                return Optional.of("재료명·단위 누락");
            }
            BigDecimal quantity = ingredient.quantity();
            if (quantity == null || quantity.signum() <= 0 || quantity.compareTo(MAX_QUANTITY) > 0) {
                return Optional.of("재료 수량 비정상: " + ingredient.name());
            }
        }
        List<String> steps = suggestion.steps();
        if (steps == null || steps.isEmpty() || steps.stream().anyMatch(step -> isBlank(step, 500))) {
            return Optional.of("조리 순서 누락");
        }
        List<String> violations = IngredientRestriction.violations(
                ingredients.stream().map(AiMealSuggestion.Ingredient::name).toList(), restricted);
        if (!violations.isEmpty()) {
            return Optional.of("제한 재료 포함: " + String.join(", ", violations));
        }
        return Optional.empty();
    }

    private static boolean isBlank(String value, int maxLength) {
        return value == null || value.isBlank() || value.strip().length() > maxLength;
    }

    private static boolean isNegative(BigDecimal value) {
        return value != null && value.signum() < 0;
    }
}
