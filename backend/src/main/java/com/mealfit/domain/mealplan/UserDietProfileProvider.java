package com.mealfit.domain.mealplan;

/**
 * 사용자 프로필(목표·알레르기·제외 재료 등)을 식단 도메인에 넘겨주는 연결부.
 * 프로필 API가 생기면 프로필 담당자가 이 인터페이스를 구현한 빈을 등록한다.
 * 구현 빈이 없으면 MealPlanService는 {@link UserDietProfile#empty()}를 쓴다.
 */
public interface UserDietProfileProvider {

    UserDietProfile getProfile(Long userId);
}
