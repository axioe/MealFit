package com.mealfit.domain.cooking;

import com.mealfit.domain.inventory.ExpirationStatus;
import com.mealfit.domain.inventory.InventoryLot;
import com.mealfit.domain.mealplan.MealPlan;
import com.mealfit.domain.recipe.Quantity;
import com.mealfit.domain.recipe.Recipe;
import com.mealfit.domain.recipe.RecipeIngredient;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 조리 차감 계획. 미리보기와 실제 차감이 같은 계산을 쓴다 (FR-COOK-01: 미리보기와 실제 차감 일치).
 * - 필요량: 레시피 재료량을 식단 인분으로 환산 (개수 단위는 올림), 같은 재료·단위 계열은 합친다
 * - 사용할 묶음: 같은 재료·단위 계열의 ACTIVE 묶음 중 기한이 지나지 않은 것 (BR-05)
 * - 차감 순서: 기한이 빠른 묶음(오늘 만료 포함)부터, 기한 미등록 묶음은 마지막 (D11)
 * - 묶음 단위가 kg·L이면 그 단위로 바꿔 차감한다
 */
public record CookingPlan(List<IngredientPlan> ingredients) {

    private static final BigDecimal MIN_DEDUCTION = new BigDecimal("0.001");

    public record Deduction(InventoryLot lot, BigDecimal quantity) {
    }

    /**
     * @param requiredQty  필요량 (기본 단위: g, ml, 개 …)
     * @param availableQty 쓸 수 있는 재고 합계 (기본 단위)
     * @param shortageQty  부족량 (기본 단위)
     */
    public record IngredientPlan(String ingredientName, BigDecimal requiredQty, BigDecimal availableQty,
                                 BigDecimal shortageQty, String unit, List<Deduction> deductions) {

        public boolean isShort() {
            return shortageQty.signum() > 0;
        }
    }

    private record Key(String ingredientName, String unit) {
    }

    /**
     * @param lots 사용자의 ACTIVE 재고 묶음 (기한 경과 묶음은 여기서 걸러낸다)
     */
    public static CookingPlan of(MealPlan plan, List<InventoryLot> lots, LocalDate today) {
        Recipe recipe = plan.getRecipe();
        Map<Key, BigDecimal> needs = new LinkedHashMap<>();
        for (RecipeIngredient ingredient : recipe.getIngredients()) {
            Quantity need = Quantity.of(ingredient.getRequiredQty(), ingredient.getUnit())
                    .scaleServings(recipe.getServingSize(), plan.getServings())
                    .toBaseUnit();
            needs.merge(new Key(ingredient.getIngredientName().strip(), need.unit()), need.amount(), BigDecimal::add);
        }

        List<InventoryLot> usable = lots.stream()
                .filter(lot -> lot.expirationStatus(today) != ExpirationStatus.EXPIRED)
                .sorted(Comparator.comparing(InventoryLot::getExpiryDate,
                                Comparator.nullsLast(Comparator.naturalOrder()))
                        .thenComparing(InventoryLot::getId))
                .toList();

        List<IngredientPlan> ingredients = new ArrayList<>();
        needs.forEach((key, required) -> {
            BigDecimal available = BigDecimal.ZERO;
            BigDecimal remaining = required;
            List<Deduction> deductions = new ArrayList<>();
            for (InventoryLot lot : usable) {
                Quantity lotQuantity = Quantity.of(lot.getQuantity(), lot.getUnit());
                Quantity lotBase = lotQuantity.toBaseUnit();
                if (!lot.getIngredientName().strip().equals(key.ingredientName())
                        || !lotBase.unit().equals(key.unit())
                        || lotBase.amount().signum() <= 0) {
                    continue;
                }
                available = available.add(lotBase.amount());
                if (remaining.signum() <= 0) {
                    continue;
                }
                BigDecimal take = remaining.min(lotBase.amount());
                // 묶음을 다 쓰면 원래 수량 그대로 차감해 단위 변환 반올림 오차가 남지 않게 한다
                BigDecimal inLotUnit = take.compareTo(lotBase.amount()) == 0
                        ? lot.getQuantity()
                        : Quantity.of(take, key.unit()).convertTo(lot.getUnit()).amount();
                if (inLotUnit.signum() == 0) {
                    // kg·L 묶음에서 1g·1ml 미만을 빼면 0.000이 되므로 최소 단위만큼 차감한다
                    inLotUnit = MIN_DEDUCTION;
                }
                deductions.add(new Deduction(lot, inLotUnit));
                remaining = remaining.subtract(take);
            }
            ingredients.add(new IngredientPlan(key.ingredientName(), required, available,
                    remaining.max(BigDecimal.ZERO), key.unit(), deductions));
        });
        return new CookingPlan(ingredients);
    }

    public boolean hasShortage() {
        return ingredients.stream().anyMatch(IngredientPlan::isShort);
    }

    /** 예: "달걀 1개, 우유 200ml" */
    public String shortageSummary() {
        return String.join(", ", ingredients.stream()
                .filter(IngredientPlan::isShort)
                .map(ingredient -> ingredient.ingredientName() + " "
                        + ingredient.shortageQty().stripTrailingZeros().toPlainString() + ingredient.unit())
                .toList());
    }
}
