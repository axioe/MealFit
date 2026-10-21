package com.mealfit.domain.recipe.dto;

import com.mealfit.domain.recipe.Quantity;
import com.mealfit.domain.recipe.Recipe;
import com.mealfit.domain.recipe.RecipeIngredient;
import com.mealfit.domain.recipe.RecipeSource;
import java.math.BigDecimal;
import java.util.List;

/**
 * 레시피 상세. ingredients의 수량은 요청한 servings 기준으로 환산된 값이다.
 * 영양 정보는 저장된 값 그대로이며, nutritionEstimated가 true면 화면에 "추정치"를 표시한다.
 */
public record RecipeDetailResponse(
        Long id,
        String name,
        String description,
        int servingSize,
        int servings,
        int cookTimeMin,
        BigDecimal calories,
        BigDecimal proteinG,
        BigDecimal carbsG,
        BigDecimal fatG,
        boolean nutritionEstimated,
        RecipeSource source,
        List<String> steps,
        List<IngredientResponse> ingredients
) {

    public record IngredientResponse(String ingredientName, BigDecimal quantity, String unit) {

        static IngredientResponse of(RecipeIngredient ingredient, int servingSize, int servings) {
            Quantity scaled = Quantity.of(ingredient.getRequiredQty(), ingredient.getUnit())
                    .scaleServings(servingSize, servings);
            return new IngredientResponse(ingredient.getIngredientName(), scaled.amount(), scaled.unit());
        }
    }

    public static RecipeDetailResponse from(Recipe recipe, int servings) {
        List<IngredientResponse> ingredients = recipe.getIngredients().stream()
                .map(ingredient -> IngredientResponse.of(ingredient, recipe.getServingSize(), servings))
                .toList();
        return new RecipeDetailResponse(
                recipe.getId(),
                recipe.getName(),
                recipe.getDescription(),
                recipe.getServingSize(),
                servings,
                recipe.getCookTimeMin(),
                recipe.getCalories(),
                recipe.getProteinG(),
                recipe.getCarbsG(),
                recipe.getFatG(),
                recipe.isNutritionEstimated(),
                recipe.getSource(),
                List.copyOf(recipe.getSteps()),
                ingredients);
    }
}
