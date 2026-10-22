package com.mealfit.domain.user.service;

import com.mealfit.domain.auth.repository.RefreshTokenRepository;
import com.mealfit.domain.user.dto.WithdrawRequest;
import com.mealfit.domain.user.entity.User;
import com.mealfit.domain.user.repository.UserRepository;
import com.mealfit.global.exception.BusinessException;
import com.mealfit.global.exception.ErrorCode;
import java.nio.charset.StandardCharsets;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 비밀번호 확인·탈퇴 기록·전체 세션 폐기를 하나의 트랜잭션으로 처리합니다. */
@Service
@RequiredArgsConstructor
public class WithdrawalService {
    private static final int BCRYPT_MAX_BYTES = 72;
    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public void withdraw(Long userId, WithdrawRequest request) {
        // 로그인·재발급과 같은 회원 → 토큰 잠금 순서로 동시 요청을 처리합니다.
        User user = userRepository.findByIdForUpdate(userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        if (user.getDeletedAt() != null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }

        // 비밀번호 앞뒤 공백도 비밀번호의 일부이므로 trim하지 않습니다.
        // BCrypt가 처리할 수 없는 바이트 길이는 비교 전에 거절합니다.
        if (request.password().getBytes(StandardCharsets.UTF_8).length > BCRYPT_MAX_BYTES
                || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new BusinessException(ErrorCode.USER_PASSWORD_MISMATCH);
        }

        // 이후 토큰 폐기에서 실패해도 탈퇴 기록까지 함께 롤백됩니다.
        user.withdraw();
        refreshTokenRepository.revokeAllByUserId(userId);
    }
}
