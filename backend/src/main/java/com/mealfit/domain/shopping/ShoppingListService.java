package com.mealfit.domain.shopping;

import com.mealfit.domain.cooking.CookingEventRepository;
import com.mealfit.domain.cooking.CookingStatus;
import com.mealfit.domain.inventory.ExpirationStatus;
import com.mealfit.domain.inventory.InventoryLot;
import com.mealfit.domain.inventory.InventoryLotRepository;
import com.mealfit.domain.inventory.LotStatus;
import com.mealfit.domain.mealplan.MealPlan;
import com.mealfit.domain.mealplan.MealPlanRepository;
import com.mealfit.domain.mealplan.MealPlanStatus;
import com.mealfit.domain.recipe.Quantity;
import com.mealfit.domain.recipe.Recipe;
import com.mealfit.domain.recipe.RecipeIngredient;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 장보기 부족분 계산 (BR-04).
 * 대상은 오늘 이후의 확정 식단 중 아직 조리하지 않은 것 전체이며, 재료·단위 계열마다 한 줄로 합친다(D06).
 * 부족분 = max(0, 필요량 합계 + 최소 유지량 - 사용 가능한 재고)
 * - 필요량: 레시피 재료량을 식단 인분으로 환산한 값 (개수 단위는 끼니마다 올림)
 * - 사용 가능한 재고: ACTIVE 묶음 중 기한이 지나지 않은 것 (BR-05)
 * - 최소 유지량: 같은 재료 묶음들(폐기 제외) 중 가장 큰 값 (D05)
 * - kg·L는 g·ml로 바꿔 합치고, 개·팩처럼 다른 계열 단위는 따로 계산한다 (BR-03)
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShoppingListService {

    private final ShoppingItemRepository shoppingItemRepository;
    private final MealPlanRepository mealPlanRepository;
    private final CookingEventRepository cookingEventRepository;
    private final InventoryLotRepository inventoryLotRepository;

    /** 재료명 + 기본 단위(g, ml, 개 …) */
    private record Key(String ingredientName, String unit) {

        static Key of(String ingredientName, Quantity baseQuantity) {
            return new Key(ingredientName.strip(), baseQuantity.unit());
        }
    }

    /** 식단 확정·취소 후 호출한다. 다시 계산한 장보기 목록 전체를 돌려준다. */
    @Transactional
    public List<ShoppingItem> recalculate(Long userId, LocalDate today) {
        Map<Key, BigDecimal> needs = sumNeeds(userId, today);
        Map<Key, BigDecimal> stock = new HashMap<>();
        Map<Key, BigDecimal> minStock = new HashMap<>();
        for (InventoryLot lot : inventoryLotRepository.findByUserIdAndStatusOrderByExpiryDateAsc(
                userId, LotStatus.ACTIVE)) {
            Quantity quantity = Quantity.of(lot.getQuantity(), lot.getUnit()).toBaseUnit();
            Key key = Key.of(lot.getIngredientName(), quantity);
            if (lot.expirationStatus(today) != ExpirationStatus.EXPIRED) {
                stock.merge(key, quantity.amount(), BigDecimal::add);
            }
            mergeMinStock(minStock, lot);
        }
        for (InventoryLot lot : inventoryLotRepository.findByUserIdAndStatusOrderByExpiryDateAsc(
                userId, LotStatus.DEPLETED)) {
            mergeMinStock(minStock, lot);
        }

        Map<Key, ShoppingItem> items = new LinkedHashMap<>();
        for (ShoppingItem item : shoppingItemRepository.findByUserIdOrderByIdAsc(userId)) {
            items.putIfAbsent(Key.of(item.getIngredientName(),
                    Quantity.of(item.getRequiredQty(), item.getUnit()).toBaseUnit()), item);
        }

        Set<Key> keys = new LinkedHashSet<>(items.keySet());
        keys.addAll(needs.keySet());
        List<ShoppingItem> result = new ArrayList<>();
        for (Key key : keys) {
            BigDecimal shortage = BigDecimal.ZERO;
            if (needs.containsKey(key)) {
                shortage = needs.get(key)
                        .add(minStock.getOrDefault(key, BigDecimal.ZERO))
                        .subtract(stock.getOrDefault(key, BigDecimal.ZERO))
                        .max(BigDecimal.ZERO);
            }
            ShoppingItem item = items.get(key);
            if (item == null) {
                if (shortage.signum() > 0) {
                    result.add(shoppingItemRepository.save(
                            ShoppingItem.create(userId, key.ingredientName(), shortage, key.unit())));
                }
                continue;
            }
            item.updateRequiredQty(shortage);
            if (item.isEmpty()) {
                shoppingItemRepository.delete(item);
            } else {
                result.add(item);
            }
        }
        return result;
    }

    private Map<Key, BigDecimal> sumNeeds(Long userId, LocalDate today) {
        Map<Key, BigDecimal> needs = new LinkedHashMap<>();
        List<MealPlan> plans = mealPlanRepository.findByUserIdAndStatusAndPlanDateGreaterThanEqual(
                userId, MealPlanStatus.CONFIRMED, today);
        for (MealPlan plan : plans) {
            if (cookingEventRepository.existsByMealPlanIdAndStatus(plan.getId(), CookingStatus.COOKED)) {
                continue;
            }
            Recipe recipe = plan.getRecipe();
            for (RecipeIngredient ingredient : recipe.getIngredients()) {
                Quantity need = Quantity.of(ingredient.getRequiredQty(), ingredient.getUnit())
                        .scaleServings(recipe.getServingSize(), plan.getServings())
                        .toBaseUnit();
                needs.merge(Key.of(ingredient.getIngredientName(), need), need.amount(), BigDecimal::add);
            }
        }
        return needs;
    }

    private static void mergeMinStock(Map<Key, BigDecimal> minStock, InventoryLot lot) {
        Quantity min = Quantity.of(lot.getMinStockQty(), lot.getUnit()).toBaseUnit();
        minStock.merge(Key.of(lot.getIngredientName(), min), min.amount(), BigDecimal::max);
    }
}
