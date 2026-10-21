package com.mealfit.domain.recipe;

import com.mealfit.domain.recipe.dto.RecipeDetailResponse;
import com.mealfit.global.exception.BusinessException;
import com.mealfit.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RecipeService {

    private final RecipeRepository recipeRepository;

    /** servings가 없으면 레시피 기준 인분으로 보여준다. */
    public RecipeDetailResponse getDetail(Long userId, Long recipeId, Integer servings) {
        if (servings != null && servings < 1) {
            throw new BusinessException(ErrorCode.INVALID_INPUT, "인분은 1 이상이어야 합니다.");
        }
        Recipe recipe = recipeRepository.findAccessibleById(recipeId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.RECIPE_NOT_FOUND));
        return RecipeDetailResponse.from(recipe, servings != null ? servings : recipe.getServingSize());
    }
}
