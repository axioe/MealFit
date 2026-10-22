package com.mealfit.domain.cooking.dto;

import com.mealfit.domain.cooking.CookingPlan;
import com.mealfit.domain.recipe.Quantity;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

/**
 * 식단 없이 재료 목록만으로 조리 (15분 요리 등). 수량은 인분 환산 없이 실제로 쓴 양이다.
 *
 * @param clientRequestId 조리 완료에만 필요하다. 같은 조리를 다시 보낼 때는 같은 값을 보내면 한 번만 차감한다.
 * @param servings        기록용 인분. 없으면 1인분
 */
public record IngredientCookingRequest(
        @Pattern(regexp = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$",
                message = "조리 요청 ID는 UUID 형식이어야 합니다.") String clientRequestId,
        @NotBlank(message = "메뉴 이름을 입력해 주세요.")
        @Size(max = 100, message = "메뉴 이름은 100자 이내로 입력해 주세요.") String recipeName,
        @Min(value = 1, message = "인분은 1~10으로 입력해 주세요.")
        @Max(value = 10, message = "인분은 1~10으로 입력해 주세요.") Integer servings,
        @NotEmpty(message = "사용할 재료를 하나 이상 보내 주세요.")
        @Size(max = 30, message = "재료는 30개까지 보낼 수 있습니다.") List<@Valid Ingredient> ingredients
) {

    public record Ingredient(
            @NotBlank(message = "재료명을 입력해 주세요.")
            @Size(max = 100, message = "재료명은 100자 이내로 입력해 주세요.") String ingredientName,
            @NotNull(message = "사용 수량을 입력해 주세요.")
            @DecimalMin(value = "0", inclusive = false, message = "사용 수량은 0보다 커야 합니다.")
            @Digits(integer = 9, fraction = 3, message = "수량은 정수 9자리, 소수 3자리까지 입력해 주세요.")
            BigDecimal quantity,
            @NotBlank(message = "단위를 입력해 주세요.")
            @Size(max = 20, message = "단위는 20자 이내로 입력해 주세요.") String unit
    ) {
    }

    public int servingsOrDefault() {
        return servings == null ? 1 : servings;
    }

    public String strippedRecipeName() {
        return recipeName.strip();
    }

    public List<CookingPlan.Usage> usages() {
        return ingredients.stream()
                .map(ingredient -> new CookingPlan.Usage(ingredient.ingredientName(),
                        Quantity.of(ingredient.quantity(), ingredient.unit())))
                .toList();
    }
}
