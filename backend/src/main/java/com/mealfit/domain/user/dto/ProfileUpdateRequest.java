package com.mealfit.domain.user.dto;

import com.mealfit.domain.user.Goal;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Set;

public record ProfileUpdateRequest(
        @NotBlank @Size(max = 20) String nickname,
        @NotNull Goal goal,
        @Schema(allowableValues = {"10", "20", "30"}) int cookingTimePref,
        @PositiveOrZero Integer budgetPerMeal,
        @Size(max = 30) List<@NotBlank @Size(max = 100) String> allergies,
        @Size(max = 30) List<@NotBlank @Size(max = 100) String> excludedIngredients
) {

    private static final Set<Integer> COOKING_TIMES = Set.of(10, 20, 30);

    @Schema(hidden = true)
    @AssertTrue(message = "조리 시간은 10, 20, 30분 중 하나여야 합니다.")
    public boolean isCookingTimePrefValid() {
        return COOKING_TIMES.contains(cookingTimePref);
    }
}
