package com.mealfit.domain.recipe;

import com.mealfit.domain.recipe.dto.RecipeDetailResponse;
import com.mealfit.global.web.CurrentUserId;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Tag(name = "Recipe", description = "레시피")
@RestController
@RequestMapping("/api/v1/recipes")
@RequiredArgsConstructor
public class RecipeController {

    private final RecipeService recipeService;

    @Operation(summary = "레시피 상세 (인분 환산)")
    @GetMapping("/{id}")
    public RecipeDetailResponse getDetail(@CurrentUserId Long userId,
                                          @PathVariable Long id,
                                          @RequestParam(required = false) Integer servings) {
        return recipeService.getDetail(userId, id, servings);
    }
}
