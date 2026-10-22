package com.mealfit.domain.ai;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

public final class QuickRecipeModels {
    private QuickRecipeModels() { }

    public record Request(
            @NotEmpty @Size(max = 100) List<@NotNull @Positive Long> selectedLotIds,
            @NotNull @Min(1) @Max(15) Integer maxCookingMinutes,
            @NotNull @Min(1) @Max(5) Integer recommendationCount) { }

    public record Stock(String name, BigDecimal quantity, String unit, LocalDate expirationDate) { }
    public record AiRequest(List<Stock> ingredients, List<String> selectedIngredients,
                            int maxCookingMinutes, int recommendationCount, String userGoal,
                            Set<String> allergies, Set<String> excludedIngredients) { }
    public record Response(@NotBlank @Pattern(regexp = "AI_GENERATED") String source,
                           @NotNull LocalDate asOfDate,
                           @NotEmpty @Size(max = 5) List<@NotNull @Valid Recipe> recipes) { }
    public record Recipe(@NotBlank @Size(max = 100) String title,
                         @NotBlank @Size(max = 2000) String description,
                         @NotNull @Min(1) @Max(15) Integer cookingMinutes,
                         @NotNull @Min(1) @Max(10) Integer servings,
                         @NotEmpty @Size(max = 100) List<@NotNull @Valid Ingredient> ingredients,
                         @NotEmpty @Size(max = 50) List<@NotBlank @Size(max = 2000) String> steps,
                         @NotBlank @Size(max = 2000) String reason) { }
    public record Ingredient(@NotBlank @Size(max = 100) String name,
                             @NotNull @DecimalMin(value = "0", inclusive = false) @Digits(integer = 9, fraction = 3) BigDecimal quantity,
                             @NotBlank @Size(max = 20) String unit,
                             @NotNull @Valid Comparison inventory) { }
    public record Comparison(@NotNull @DecimalMin("0") BigDecimal quantity,
                             @NotBlank @Size(max = 20) String unit,
                             @DecimalMin("0") BigDecimal shortageQuantity,
                             @NotBlank @Pattern(regexp = "SUFFICIENT|SHORTAGE|NONE|UNIT_MISMATCH") String status,
                             @NotNull Boolean hasIncompatibleUnits) { }
}
