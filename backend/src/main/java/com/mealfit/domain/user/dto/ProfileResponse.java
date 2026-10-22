package com.mealfit.domain.user.dto;

import com.mealfit.domain.user.entity.Profile;
import java.util.Set;

/**
 * 내 프로필 조회·수정 결과입니다.
 * 비밀번호나 토큰 등 인증 정보는 포함하지 않습니다.
 */
public record ProfileResponse(
    String nickname,
    String goal,
    Integer cookTimeMin,
    Integer mealBudget,
    Set<String> allergies,
    Set<String> excludedIngredients
) {

    /**
     * 프로필 엔티티를 화면에 전달할 응답으로 변환합니다.
     * 지연 로딩 목록을 읽으므로 Service 트랜잭션 안에서 호출합니다.
     */
    public static ProfileResponse from(Profile profile) {
        return new ProfileResponse(
            profile.getNickname(),
            profile.getGoal(),
            profile.getCookTimeMin(),
            profile.getMealBudget(),
            profile.getAllergies(),
            profile.getExcludedIngredients()
        );
    }
}
