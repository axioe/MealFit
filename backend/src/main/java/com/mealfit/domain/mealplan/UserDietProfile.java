package com.mealfit.domain.mealplan;

import java.util.HashSet;
import java.util.Set;

/**
 * 식단 추천·검증에 쓰는 사용자 조건. 이름·이메일 같은 개인 식별 정보는 담지 않는다.
 *
 * @param goal               목표 (감량/유지/증량). 없으면 null
 * @param cookTimeMin        선호 조리 시간(10/20/30분). 없으면 null
 * @param mealBudget         한 끼 예산. 없으면 null
 * @param allergies          알레르기 재료
 * @param excludedIngredients 제외 재료
 */
public record UserDietProfile(
        String goal,
        Integer cookTimeMin,
        Integer mealBudget,
        Set<String> allergies,
        Set<String> excludedIngredients
) {

    public UserDietProfile {
        allergies = allergies == null ? Set.of() : Set.copyOf(allergies);
        excludedIngredients = excludedIngredients == null ? Set.of() : Set.copyOf(excludedIngredients);
    }

    /** 프로필이 아직 없을 때 쓰는 빈 조건 */
    public static UserDietProfile empty() {
        return new UserDietProfile(null, null, null, Set.of(), Set.of());
    }

    /** 알레르기와 제외 재료를 합친 차단 목록 */
    public Set<String> restrictedIngredients() {
        Set<String> restricted = new HashSet<>(allergies);
        restricted.addAll(excludedIngredients);
        return restricted;
    }
}
