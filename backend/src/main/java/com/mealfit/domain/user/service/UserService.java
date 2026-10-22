package com.mealfit.domain.user.service;

import com.mealfit.domain.user.entity.User;
import com.mealfit.domain.user.entity.Profile;
import com.mealfit.domain.user.repository.UserRepository;
import com.mealfit.domain.user.repository.ProfileRepository;

import com.mealfit.domain.user.dto.MeResponse;
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
}
