package com.mealfit.domain.cooking.dto;

import com.mealfit.domain.cooking.CookingPlan;
import com.mealfit.domain.inventory.ExpirationStatus;
import com.mealfit.domain.inventory.InventoryLot;
import com.mealfit.domain.inventory.StorageLocation;
import com.mealfit.domain.mealplan.MealPlan;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * 조리 차감 미리보기. 재고와 이력은 바꾸지 않는다.
 *
 * @param canCook       지금 조리 완료를 누를 수 있는지
 * @param blockedReason 조리할 수 없는 이유 (가능하면 null)
 */
public record CookingPreviewResponse(
        Long mealPlanId,
        String recipeName,
        int servings,
        boolean cooked,
        boolean canCook,
        String blockedReason,
        List<Ingredient> ingredients
) {

    /** 수량은 모두 기본 단위(g, ml, 개 …)이며, 묶음별 차감량만 그 묶음의 단위를 쓴다. */
    public record Ingredient(String ingredientName, BigDecimal requiredQty, BigDecimal availableQty,
                             BigDecimal shortageQty, String unit, List<LotDeduction> deductions) {
    }

    public record LotDeduction(Long lotId, BigDecimal quantity, String unit, LocalDate expiryDate,
                               ExpirationStatus expirationStatus, StorageLocation storageLocation) {
    }

    public static CookingPreviewResponse of(MealPlan plan, CookingPlan cookingPlan, boolean cooked,
                                            String blockedReason, LocalDate today) {
        List<Ingredient> ingredients = cookingPlan.ingredients().stream()
                .map(ingredient -> new Ingredient(ingredient.ingredientName(), ingredient.requiredQty(),
                        ingredient.availableQty(), ingredient.shortageQty(), ingredient.unit(),
                        ingredient.deductions().stream()
                                .map(deduction -> lotDeduction(deduction, today))
                                .toList()))
                .toList();
        return new CookingPreviewResponse(plan.getId(), plan.getRecipe().getName(), plan.getServings(), cooked,
                blockedReason == null, blockedReason, ingredients);
    }

    private static LotDeduction lotDeduction(CookingPlan.Deduction deduction, LocalDate today) {
        InventoryLot lot = deduction.lot();
        return new LotDeduction(lot.getId(), deduction.quantity(), lot.getUnit(), lot.getExpiryDate(),
                lot.expirationStatus(today), lot.getStorageLocation());
    }
}
