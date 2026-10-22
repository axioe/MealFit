package com.mealfit.domain.cooking.dto;

import com.mealfit.domain.cooking.CookingPlan;
import com.mealfit.domain.recipe.Quantity;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

/**
 * 조리 완료·미리보기. 인분은 식단(meal_plans.servings)을 따른다.
 *
 * @param ingredients 실제로 쓴 재료와 수량. 없으면 레시피 재료량을 인분 환산해 차감한다.
 *                    보내면 레시피 재료의 수량만 바꿀 수 있고, 목록에 없거나 0인 재료는 쓰지 않은 것으로 본다.
 */
public record CookingEventRequest(
        @NotNull(message = "조리할 식단을 선택해 주세요.") Long mealPlanId,
        @Size(max = 100, message = "재료는 100개까지 보낼 수 있습니다.") List<@Valid Ingredient> ingredients
) {

    /** 수량은 인분 환산 없이 실제로 쓴 양이다. */
    public record Ingredient(
            @NotBlank(message = "재료명을 입력해 주세요.")
            @Size(max = 100, message = "재료명은 100자 이내로 입력해 주세요.") String ingredientName,
            @NotNull(message = "사용 수량을 입력해 주세요.")
            @DecimalMin(value = "0", message = "사용 수량은 음수일 수 없습니다.")
            @Digits(integer = 9, fraction = 3, message = "수량은 정수 9자리, 소수 3자리까지 입력해 주세요.")
            BigDecimal quantity,
            @NotBlank(message = "단위를 입력해 주세요.")
            @Size(max = 20, message = "단위는 20자 이내로 입력해 주세요.") String unit
    ) {
    }

    /** 레시피 기준으로 조리한다. */
    public CookingEventRequest(Long mealPlanId) {
        this(mealPlanId, null);
    }

    /** 수정한 재료 목록. 보내지 않았으면 null (레시피 기준). */
    public List<CookingPlan.Usage> usages() {
        if (ingredients == null) {
            return null;
        }
        return ingredients.stream()
                .map(ingredient -> new CookingPlan.Usage(ingredient.ingredientName(),
                        Quantity.of(ingredient.quantity(), ingredient.unit())))
                .toList();
    }
}
