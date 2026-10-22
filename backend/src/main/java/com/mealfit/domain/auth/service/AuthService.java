package com.mealfit.domain.auth.service;

import com.mealfit.domain.auth.entity.RefreshToken;
import com.mealfit.domain.auth.repository.RefreshTokenRepository;
import com.mealfit.domain.auth.exception.RefreshTokenReuseException;

import com.mealfit.domain.auth.dto.LoginRequest;
import com.mealfit.domain.auth.dto.SignupRequest;
import com.mealfit.domain.auth.dto.TokenResponse;
import com.mealfit.domain.user.entity.Profile;
import com.mealfit.domain.user.repository.ProfileRepository;
import com.mealfit.domain.user.entity.User;
import com.mealfit.domain.user.repository.UserRepository;
import com.mealfit.global.exception.BusinessException;
import com.mealfit.global.exception.ErrorCode;
import com.mealfit.global.security.JwtProperties;
import com.mealfit.global.security.JwtTokenProvider;
import com.mealfit.global.security.RefreshTokenProvider;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 회원가입과 로그인을 처리합니다.
 * 회원가입 시 회원·기본 프로필·Refresh Token을 함께 저장합니다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private static final int BCRYPT_MAX_BYTES = 72;

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenProvider refreshTokenProvider;
    private final JwtProperties jwtProperties;

    /**
     * 회원가입 후 토큰을 발급해 바로 로그인된 상태로 만듭니다.
     * 이메일 인증은 현재 범위에 포함하지 않습니다.
     */
    @Transactional
    public TokenResponse signup(SignupRequest request) {
        String email = normalizeEmail(request.email());

        if (userRepository.existsByEmail(email)) {
            throw new BusinessException(
                ErrorCode.AUTH_EMAIL_DUPLICATED
            );
        }

        validatePasswordByteLength(request.password());

        String passwordHash = passwordEncoder.encode(
            request.password()
        );

        User user = saveUser(email, passwordHash);

        Profile profile = profileRepository.save(
            Profile.create(user.getId(), request.nickname().trim())
        );

        return issueTokens(user, profile);
    }

    /**
     * 이메일과 비밀번호를 확인하고 토큰을 발급합니다.
     * 이메일 존재 여부와 비밀번호 불일치는 같은 오류로 응답합니다.
     */
    @Transactional
    public TokenResponse login(LoginRequest request) {
        String email = normalizeEmail(request.email());

        // BCrypt 제한을 넘는 입력은 로그인 실패로 처리합니다.
        if (passwordByteLength(request.password()) > BCRYPT_MAX_BYTES) {
            throw new BusinessException(ErrorCode.AUTH_LOGIN_FAILED);
        }

        User user = userRepository.findByEmail(email)
            .orElseThrow(() ->
                new BusinessException(ErrorCode.AUTH_LOGIN_FAILED)
            );

        if (!passwordEncoder.matches(
            request.password(),
            user.getPasswordHash())) {
            throw new BusinessException(ErrorCode.AUTH_LOGIN_FAILED);
        }

        // 회원가입 때 기본 프로필을 반드시 생성하므로,
        // 프로필 누락은 잘못된 비밀번호가 아닌 서버 데이터 문제입니다.
        Profile profile = profileRepository.findByUserId(user.getId())
            .orElseThrow(() ->
                new BusinessException(ErrorCode.INTERNAL_ERROR)
            );

        return issueTokens(user, profile);
    }

    /**
     * Refresh Token을 한 번 사용한 뒤 새 토큰 쌍으로 교체합니다.
     * 재사용이 감지되면 전체 토큰 폐기는 저장하고 인증 오류를 반환합니다.
     */
    @Transactional(noRollbackFor = RefreshTokenReuseException.class)
    public TokenResponse refresh(String rawToken) {
        String tokenHash = refreshTokenProvider.hashToken(rawToken);

        Long userId = refreshTokenRepository.findUserIdByTokenHash(tokenHash)
            .orElseThrow(() ->
                new BusinessException(ErrorCode.AUTH_INVALID_REFRESH_TOKEN)
            );

        // 로그인·재발급·로그아웃은 항상 회원 → 토큰 순서로 잠급니다.
        User user = userRepository.findByIdForUpdate(userId)
            .orElseThrow(() ->
                new BusinessException(ErrorCode.AUTH_INVALID_REFRESH_TOKEN)
            );

        RefreshToken token = refreshTokenRepository
            .findByTokenHashForUpdate(tokenHash)
            .orElseThrow(() ->
                new BusinessException(ErrorCode.AUTH_INVALID_REFRESH_TOKEN)
            );

        if (token.isRevoked()) {
            refreshTokenRepository.revokeAllByUserId(userId);
            throw new RefreshTokenReuseException();
        }

        if (token.isExpired(LocalDateTime.now())) {
            throw new BusinessException(ErrorCode.AUTH_INVALID_REFRESH_TOKEN);
        }

        Profile profile = profileRepository.findByUserId(userId)
            .orElseThrow(() ->
                new BusinessException(ErrorCode.INTERNAL_ERROR)
            );

        // 기존 토큰 폐기와 새 토큰 저장은 같은 트랜잭션에서 처리합니다.
        token.revoke();
        return issueTokens(user, profile);
    }

    /**
     * 전달받은 Refresh Token을 폐기합니다.
     * 알 수 없거나 이미 폐기된 토큰도 동일하게 완료합니다.
     */
    @Transactional
    public void logout(String rawToken) {
        String tokenHash = refreshTokenProvider.hashToken(rawToken);

        Long userId = refreshTokenRepository.findUserIdByTokenHash(tokenHash)
            .orElse(null);
        if (userId == null) {
            return;
        }

        User user = userRepository.findByIdForUpdate(userId).orElse(null);
        if (user == null) {
            return;
        }

        refreshTokenRepository.findByTokenHashForUpdate(tokenHash)
            .ifPresent(RefreshToken::revoke);
    }

    /** 이메일 저장·조회 기준을 동일하게 맞춥니다. */
    private String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    /** 한글 등을 포함한 비밀번호의 실제 UTF-8 바이트 수입니다. */
    private int passwordByteLength(String password) {
        return password.getBytes(StandardCharsets.UTF_8).length;
    }

    /** BCrypt가 처리할 수 없는 길이는 가입 전에 거부합니다. */
    private void validatePasswordByteLength(String password) {
        if (passwordByteLength(password) > BCRYPT_MAX_BYTES) {
            throw new BusinessException(
                ErrorCode.INVALID_INPUT,
                "비밀번호는 UTF-8 기준 72바이트 이하로 입력해 주세요."
            );
        }
    }

    /**
     * 사전 중복 검사 이후 동시에 가입하는 경우에도
     * DB의 이메일 UNIQUE 제약으로 중복을 차단합니다.
     */
    private User saveUser(String email, String passwordHash) {
        try {
            return userRepository.saveAndFlush(
                User.create(email, passwordHash)
            );
        } catch (DataIntegrityViolationException exception) {
            // 현재 User 저장에 전달하는 값은 검증된 이메일과
            // BCrypt 해시이므로, UNIQUE 위반 여부를 원인에서 확인합니다.
            if (isEmailUniqueViolation(exception)) {
                throw new BusinessException(
                    ErrorCode.AUTH_EMAIL_DUPLICATED
                );
            }

            throw exception;
        }
    }

    /**
     * Hibernate가 알려주는 제약 이름으로 이메일 중복을 구분합니다.
     * 다른 무결성 오류를 이메일 중복으로 숨기지 않습니다.
     */
    private boolean isEmailUniqueViolation(Throwable exception) {
        Throwable cause = exception;

        while (cause != null) {
            if (cause instanceof
                org.hibernate.exception.ConstraintViolationException violation) {
                String name = violation.getConstraintName();

                return name != null
                    && name.toLowerCase(Locale.ROOT)
                    .contains("uk_users_email");
            }

            cause = cause.getCause();
        }

        return false;
    }

    /**
     * Access Token과 Refresh Token을 발급합니다.
     * Refresh Token은 해시만 저장하고 원문은 응답으로 전달합니다.
     * signup/login의 쓰기 트랜잭션 안에서 호출됩니다.
     */
    private TokenResponse issueTokens(User user, Profile profile) {
        // 같은 회원의 토큰 발급·폐기를 순서대로 처리합니다.
        userRepository.findByIdForUpdate(user.getId())
            .orElseThrow(() ->
                new BusinessException(ErrorCode.UNAUTHORIZED)
            );

        String accessToken = jwtTokenProvider.createAccessToken(
            user.getId(),
            user.getEmail()
        );

        String rawRefreshToken = refreshTokenProvider.generateToken();
        String tokenHash = refreshTokenProvider.hashToken(
            rawRefreshToken
        );

        LocalDateTime expiresAt = LocalDateTime.now()
            .plus(jwtProperties.refreshTokenTtl());

        refreshTokenRepository.save(
            RefreshToken.create(user.getId(), tokenHash, expiresAt)
        );

        return new TokenResponse(
            accessToken,
            rawRefreshToken,
            "Bearer",
            jwtTokenProvider.getAccessTokenExpiresInSeconds(),
            new TokenResponse.UserInfo(
                user.getId(),
                user.getEmail(),
                profile.getNickname()
            )
        );
    }
}
