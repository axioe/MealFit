package com.mealfit.domain.shopping.dto;

import com.mealfit.domain.shopping.ShoppingItem;
import com.mealfit.domain.shopping.ShoppingItemStatus;
import java.math.BigDecimal;

/**
 * @param requiredQty  사야 할 총량 (부족분)
 * @param purchasedQty 산 수량 (아직 냉장고에 넣지 않음)
 * @param remainingQty 더 살 수량 = max(0, requiredQty - purchasedQty)
 */
public record ShoppingItemResponse(
        Long id,
        String ingredientName,
        BigDecimal requiredQty,
        BigDecimal purchasedQty,
        BigDecimal remainingQty,
        String unit,
        ShoppingItemStatus status
) {

    public static ShoppingItemResponse from(ShoppingItem item) {
        return new ShoppingItemResponse(item.getId(), item.getIngredientName(), item.getRequiredQty(),
                item.getPurchasedQty(), item.remainingQty(), item.getUnit(), item.getStatus());
    }
}
