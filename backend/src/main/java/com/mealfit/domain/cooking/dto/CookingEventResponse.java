package com.mealfit.domain.cooking.dto;

import com.mealfit.domain.cooking.CookingEvent;
import com.mealfit.domain.cooking.CookingStatus;
import com.mealfit.domain.inventory.InventoryTransaction;
import com.mealfit.domain.inventory.InventoryTransactionType;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 조리 기록과 재고 변경 내역.
 *
 * @param changes 이번 요청으로 바뀐 재고 (차감은 -, 복원은 +)
 */
public record CookingEventResponse(
        Long id,
        Long mealPlanId,
        String recipeName,
        int servings,
        CookingStatus status,
        LocalDateTime cookedAt,
        LocalDateTime restoredAt,
        List<Change> changes
) {

    public record Change(Long lotId, String ingredientName, InventoryTransactionType type,
                         BigDecimal qtyChange, String unit) {

        static Change from(InventoryTransaction transaction) {
            return new Change(transaction.getLot().getId(), transaction.getLot().getIngredientName(),
                    transaction.getType(), transaction.getQtyChange(), transaction.getLot().getUnit());
        }
    }

    public static CookingEventResponse of(CookingEvent event, List<InventoryTransaction> transactions) {
        return new CookingEventResponse(event.getId(), event.getMealPlan().getId(), event.getRecipe().getName(),
                event.getServings(), event.getStatus(), event.getCookedAt(), event.getRestoredAt(),
                transactions.stream().map(Change::from).toList());
    }
}
