package com.mealfit.domain.user;

import com.mealfit.domain.user.dto.MeResponse;
import com.mealfit.domain.user.dto.ProfileResponse;
import com.mealfit.domain.user.dto.ProfileUpdateRequest;
import com.mealfit.global.exception.BusinessException;
import com.mealfit.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProfileService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;

    public MeResponse getMe(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return new MeResponse(user.getId(), user.getEmail(), getProfileEntity(userId).getNickname());
    }

    public ProfileResponse getProfile(Long userId) {
        return ProfileResponse.from(getProfileEntity(userId));
    }

    @Transactional
    public ProfileResponse updateProfile(Long userId, ProfileUpdateRequest request) {
        Profile profile = getProfileEntity(userId);
        profile.update(request.nickname().trim(), request.goal(), request.cookingTimePref(),
                request.budgetPerMeal(), request.allergies(), request.excludedIngredients());
        return ProfileResponse.from(profile);
    }

    /** 다른 도메인(식단 추천·검증)에서 알레르기/제외 재료를 읽을 때도 이 메서드를 쓴다. */
    public Profile getProfileEntity(Long userId) {
        return profileRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PROFILE_NOT_FOUND));
    }
}
