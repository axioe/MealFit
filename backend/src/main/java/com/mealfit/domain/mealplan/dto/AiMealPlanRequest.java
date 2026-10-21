package com.mealfit.domain.mealplan.dto;

import com.mealfit.domain.inventory.ExpirationStatus;
import com.mealfit.domain.mealplan.MealType;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;

/**
 * Spring → AI 식단 추천 요청 (초안 계약, AI 담당자와 함께 확정).
 * 개인 식별 정보(이름·이메일·인증 정보)는 넣지 않는다.
 *
 * @param mealTypes   새로 추천할 끼니
 * @param keptMeals   그대로 두는 끼니의 메뉴명 (한 끼 재추천·확정 끼니 유지 시)
 * @param recentMeals 최근 식단 메뉴명 (반복 최소화)
 */
public record AiMealPlanRequest(
        LocalDate planDate,
        List<MealType> mealTypes,
        int servings,
        String goal,
        Integer cookTimeMin,
        Integer mealBudget,
        Set<String> allergies,
        Set<String> excludedIngredients,
        List<InventoryItem> inventory,
        List<String> keptMeals,
        List<String> recentMeals
) {

    public record InventoryItem(String ingredientName, BigDecimal quantity, String unit,
                                LocalDate expiryDate, ExpirationStatus expirationStatus) {
    }
}
