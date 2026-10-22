package com.mealfit.domain.cooking;

import com.mealfit.domain.inventory.ExpirationStatus;
import com.mealfit.domain.inventory.InventoryLot;
import com.mealfit.domain.mealplan.MealPlan;
import com.mealfit.domain.recipe.Quantity;
import com.mealfit.domain.recipe.Recipe;
import com.mealfit.domain.recipe.RecipeIngredient;
import com.mealfit.global.exception.BusinessException;
import com.mealfit.global.exception.ErrorCode;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 조리 차감 계획. 미리보기와 실제 차감이 같은 계산을 쓴다 (FR-COOK-01: 미리보기와 실제 차감 일치).
 * - 필요량: 레시피 재료량을 식단 인분으로 환산 (개수 단위는 올림), 같은 재료·단위 계열은 합친다
 *   사용자가 조리 전에 수량을 고쳤으면 그 수량을 쓴다 (레시피 재료의 수량 변경·빼기만 허용)
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

    /** 사용자가 조리 전에 고친 재료 사용량 (인분 환산 없이 실제로 쓴 양) */
    public record Usage(String ingredientName, Quantity quantity) {
    }

    /**
     * @param usages 수정한 재료 사용량. null이면 레시피 기준, 있으면 레시피 재료의 수량 변경과 빼기만 허용한다.
     *               목록에 없거나 0인 재료는 차감하지 않는다.
     * @param lots   사용자의 ACTIVE 재고 묶음 (기한 경과 묶음은 여기서 걸러낸다)
     */
    public static CookingPlan of(MealPlan plan, List<Usage> usages, List<InventoryLot> lots, LocalDate today) {
        Map<Key, BigDecimal> recipeNeeds = recipeNeeds(plan);
        return allocate(usages == null ? recipeNeeds : adjustedNeeds(recipeNeeds, usages), lots, today);
    }

    /**
     * 식단·레시피 없이 재료 목록만으로 조리한다 (15분 요리 등). 보낸 수량을 그대로 차감한다.
     *
     * @param usages 사용할 재료 (수량은 0보다 커야 하며, 같은 재료·단위 계열은 한 번만)
     * @param lots   사용자의 ACTIVE 재고 묶음 (기한 경과 묶음은 여기서 걸러낸다)
     */
    public static CookingPlan ofUsages(List<Usage> usages, List<InventoryLot> lots, LocalDate today) {
        Map<Key, BigDecimal> needs = usageNeeds(usages);
        if (needs.values().stream().anyMatch(amount -> amount.signum() <= 0)) {
            throw new BusinessException(ErrorCode.COOKING_INVALID_INGREDIENT, "사용 수량은 0보다 커야 합니다.");
        }
        return allocate(needs, lots, today);
    }

    /** 필요량마다 기한이 빠른 묶음부터 차감할 양을 정한다. */
    private static CookingPlan allocate(Map<Key, BigDecimal> needs, List<InventoryLot> lots, LocalDate today) {
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

    /** 레시피 재료량을 식단 인분으로 환산하고, 같은 재료·단위 계열은 합친다. */
    private static Map<Key, BigDecimal> recipeNeeds(MealPlan plan) {
        Recipe recipe = plan.getRecipe();
        Map<Key, BigDecimal> needs = new LinkedHashMap<>();
        for (RecipeIngredient ingredient : recipe.getIngredients()) {
            Quantity need = Quantity.of(ingredient.getRequiredQty(), ingredient.getUnit())
                    .scaleServings(recipe.getServingSize(), plan.getServings())
                    .toBaseUnit();
            needs.merge(new Key(ingredient.getIngredientName().strip(), need.unit()), need.amount(), BigDecimal::add);
        }
        return needs;
    }

    /**
     * 레시피 재료 순서를 유지한 채 사용자가 보낸 수량으로 바꾼다.
     * 레시피에 없는 재료나 단위 계열이 다른 재료(예: 200g인 재료를 2개로)는 거부한다.
     */
    private static Map<Key, BigDecimal> adjustedNeeds(Map<Key, BigDecimal> recipeNeeds, List<Usage> usages) {
        Map<Key, BigDecimal> used = usageNeeds(usages);
        used.keySet().forEach(key -> {
            if (!recipeNeeds.containsKey(key)) {
                String name = key.ingredientName();
                boolean inRecipe = recipeNeeds.keySet().stream().anyMatch(k -> k.ingredientName().equals(name));
                throw new BusinessException(ErrorCode.COOKING_INVALID_INGREDIENT, inRecipe
                        ? name + "의 단위(" + key.unit() + ")가 레시피와 달라 바꿀 수 없습니다."
                        : name + "은(는) 레시피에 없는 재료입니다. 레시피 재료의 수량만 바꾸거나 뺄 수 있습니다.");
            }
        });

        Map<Key, BigDecimal> needs = new LinkedHashMap<>();
        recipeNeeds.keySet().forEach(key -> {
            BigDecimal amount = used.get(key);
            if (amount != null && amount.signum() > 0) {
                needs.put(key, amount);
            }
        });
        if (needs.isEmpty()) {
            throw new BusinessException(ErrorCode.COOKING_INVALID_INGREDIENT, "사용할 재료를 하나 이상 입력해 주세요.");
        }
        return needs;
    }

    /** 사용량을 기본 단위로 바꾼다. 같은 재료·단위 계열(예: 100g과 0.1kg)이 두 번 오면 거부한다. */
    private static Map<Key, BigDecimal> usageNeeds(List<Usage> usages) {
        Map<Key, BigDecimal> used = new LinkedHashMap<>();
        for (Usage usage : usages) {
            String name = usage.ingredientName().strip();
            Quantity base = usage.quantity().toBaseUnit();
            if (used.putIfAbsent(new Key(name, base.unit()), base.amount()) != null) {
                throw new BusinessException(ErrorCode.COOKING_DUPLICATE_INGREDIENT,
                        ErrorCode.COOKING_DUPLICATE_INGREDIENT.getMessage() + " (" + name + ")");
            }
        }
        return used;
    }

    /** 차감할 재료 이름 (재고 묶음을 잠글 때 쓴다) */
    public static Set<String> ingredientNames(List<Usage> usages) {
        return usages.stream().map(usage -> usage.ingredientName().strip()).collect(Collectors.toSet());
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
