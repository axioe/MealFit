package com.mealfit.domain.user.service;

import com.mealfit.domain.user.entity.User;
import com.mealfit.domain.user.entity.Profile;
import com.mealfit.domain.user.repository.UserRepository;
import com.mealfit.domain.user.repository.ProfileRepository;

import com.mealfit.domain.user.dto.MeResponse;
import com.mealfit.domain.user.dto.ProfileResponse;
import com.mealfit.domain.user.dto.ProfileUpdateRequest;
import com.mealfit.global.exception.BusinessException;
import com.mealfit.global.exception.ErrorCode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 로그인한 회원의 정보를 조회합니다. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;

    public MeResponse getMe(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() ->
                new BusinessException(ErrorCode.UNAUTHORIZED)
            );

        // 회원가입 시 기본 프로필을 생성하므로 누락은 데이터 오류입니다.
        Profile profile = profileRepository.findByUserId(userId)
            .orElseThrow(() ->
                new BusinessException(ErrorCode.INTERNAL_ERROR)
            );

        return new MeResponse(
            user.getId(),
            user.getEmail(),
            profile.getNickname()
        );
    }
    /**
     * 로그인한 회원의 프로필을 조회합니다.
     * 목록을 포함한 응답 변환도 트랜잭션 안에서 처리합니다.
     */
    public ProfileResponse getProfile(Long userId) {
        return ProfileResponse.from(findMyProfile(userId));
    }

    /**
     * 로그인한 회원의 프로필 전체를 수정합니다.
     * @Valid로 요청 검증을 통과한 뒤 호출합니다.
     */
    @Transactional
    public ProfileResponse updateProfile(
        Long userId,
        ProfileUpdateRequest request
    ) {
        Integer cookTimeMin = request.cookTimeMin();

        // 조리 시간은 미설정(null) 또는 10·20·30분만 허용합니다.
        if (cookTimeMin != null
            && cookTimeMin != 10
            && cookTimeMin != 20
            && cookTimeMin != 30) {
            throw new BusinessException(
                ErrorCode.INVALID_INPUT,
                "조리 시간은 10분, 20분, 30분 중 선택해 주세요."
            );
        }

        Profile profile = profileRepository.findByUserIdForUpdate(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));

        profile.updateDietProfile(
            request.nickname().trim(),
            request.goal(),
            cookTimeMin,
            request.mealBudget(),
            normalizeIngredients(request.allergies()),
            normalizeIngredients(request.excludedIngredients())
        );

        // JPA 변경 감지로 트랜잭션 종료 시 저장됩니다.
        return ProfileResponse.from(profile);
    }

    /** 회원 존재 여부를 확인하고 본인의 프로필만 조회합니다. */
    private Profile findMyProfile(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }

        // 회원가입 때 기본 프로필을 만들므로 누락은 데이터 오류입니다.
        return profileRepository.findByUserId(userId)
            .orElseThrow(() ->
                new BusinessException(ErrorCode.INTERNAL_ERROR)
            );
    }

    /** 재료명 앞뒤 공백을 제거하고 중복을 정리합니다. */
    private java.util.Set<String> normalizeIngredients(
        java.util.Set<String> ingredients
    ) {
        return ingredients.stream()
            .map(String::trim)
            .collect(java.util.stream.Collectors.toSet());
    }
}
