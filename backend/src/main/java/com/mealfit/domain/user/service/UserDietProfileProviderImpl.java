package com.mealfit.domain.user.service;

import com.mealfit.domain.mealplan.UserDietProfile;
import com.mealfit.domain.mealplan.UserDietProfileProvider;
import com.mealfit.domain.user.entity.Profile;
import com.mealfit.domain.user.repository.ProfileRepository;
import com.mealfit.global.exception.BusinessException;
import com.mealfit.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 회원 프로필의 식단 조건을 식단 도메인에 전달합니다.
 * 이름·이메일 등 개인 식별 정보는 전달하지 않습니다.
 */
@Component
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserDietProfileProviderImpl
    implements UserDietProfileProvider {

    private final ProfileRepository profileRepository;

    /**
     * 식단 추천·확정에 사용할 목표와 제한 재료를 반환합니다.
     * 알레르기·제외 재료 목록도 트랜잭션 안에서 읽습니다.
     */
    @Override
    public UserDietProfile getProfile(Long userId) {
        Profile profile = profileRepository.findByUserId(userId)
            .orElseThrow(() ->
                new BusinessException(ErrorCode.INTERNAL_ERROR)
            );

        return new UserDietProfile(
            profile.getGoal(),
            profile.getCookTimeMin(),
            profile.getMealBudget(),
            profile.getAllergies(),
            profile.getExcludedIngredients()
        );
    }
}
