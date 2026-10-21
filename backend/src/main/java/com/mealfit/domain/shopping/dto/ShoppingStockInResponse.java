package com.mealfit.domain.shopping.dto;

import com.mealfit.domain.inventory.dto.LotResponse;
import java.util.List;

/**
 * @param lots          새로 생긴 재고 묶음
 * @param shoppingItems 입고 후 다시 계산한 장보기 목록
 */
public record ShoppingStockInResponse(List<LotResponse> lots, List<ShoppingItemResponse> shoppingItems) {
}
