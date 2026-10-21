package com.mealfit.domain.mealplan.dto;

import com.mealfit.domain.shopping.dto.ShoppingItemResponse;
import java.util.List;

/**
 * 식단 확정 결과.
 *
 * @param shortages 이 식단의 재료 중 장보기 목록에 남은 부족분. 비어 있으면 "부족한 재료가 없어요"로 안내한다.
 */
public record MealPlanConfirmResponse(MealPlanResponse mealPlan, List<ShoppingItemResponse> shortages) {
}
