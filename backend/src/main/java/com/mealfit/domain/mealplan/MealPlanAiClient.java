package com.mealfit.domain.mealplan;

import com.mealfit.domain.mealplan.dto.AiMealPlanRequest;
import com.mealfit.domain.mealplan.dto.AiMealSuggestion;
import java.util.List;

/**
 * AI 식단 추천 연결부. Python AI 서비스(/ai/meal-plans) 호출은 AI 담당자가 domain/ai에서 구현한다.
 * 구현 빈이 없거나 예외(연결 실패·타임아웃·형식 오류)가 나면 MealPlanService가 검증된 로컬 대체로 전환한다.
 * 반환된 제안도 초안일 뿐이며, 서버가 형식·수량·제한 재료를 다시 검사한다.
 */
public interface MealPlanAiClient {

    /** request.mealTypes()에 있는 끼니마다 하나씩 제안한다. 빠진 끼니는 로컬 대체로 채운다. */
    List<AiMealSuggestion> recommend(AiMealPlanRequest request);
}
