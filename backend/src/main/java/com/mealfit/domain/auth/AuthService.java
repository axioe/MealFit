package com.mealfit.domain.auth;

import com.mealfit.domain.auth.dto.LoginRequest;
import com.mealfit.domain.auth.dto.SignupRequest;
import com.mealfit.domain.auth.dto.TokenResponse;
import com.mealfit.domain.user.Profile;
import com.mealfit.domain.user.ProfileRepository;
import com.mealfit.domain.user.User;
import com.mealfit.domain.user.UserRepository;
import com.mealfit.domain.user.dto.MeResponse;
import com.mealfit.global.exception.BusinessException;
import com.mealfit.global.exception.ErrorCode;
import com.mealfit.global.security.JwtProperties;
import com.mealfit.global.security.JwtTokenProvider;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final JwtProperties jwtProperties;

    @Transactional
    public TokenResponse signup(SignupRequest request) {
        String email = normalizeEmail(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new BusinessException(ErrorCode.EMAIL_ALREADY_EXISTS);
        }
        User user = userRepository.save(User.create(email, passwordEncoder.encode(request.password())));
        Profile profile = profileRepository.save(Profile.createDefault(user.getId(), request.nickname().trim()));
        return issueTokens(user, profile.getNickname());
    }

    @Transactional
    public TokenResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(normalizeEmail(request.email()))
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_CREDENTIALS));
        return issueTokens(user, findNickname(user.getId()));
    }

    /** Refresh 토큰 회전: 사용한 토큰은 폐기하고 새 토큰 쌍을 발급한다. 폐기된 토큰 재사용 시 해당 사용자 토큰 전부 폐기. */
    @Transactional(noRollbackFor = BusinessException.class)
    public TokenResponse refresh(String rawRefreshToken) {
        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash(rawRefreshToken))
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN));
        if (stored.isRevoked()) {
            refreshTokenRepository.revokeAllByUserId(stored.getUserId());
            throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
        }
        if (stored.isExpired(LocalDateTime.now())) {
            throw new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN);
        }
        stored.revoke();

        User user = userRepository.findById(stored.getUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_REFRESH_TOKEN));
        return issueTokens(user, findNickname(user.getId()));
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        refreshTokenRepository.findByTokenHash(hash(rawRefreshToken)).ifPresent(RefreshToken::revoke);
    }

    private TokenResponse issueTokens(User user, String nickname) {
        String accessToken = tokenProvider.createAccessToken(user.getId(), user.getEmail());
        String refreshToken = generateOpaqueToken();
        refreshTokenRepository.save(RefreshToken.issue(user.getId(), hash(refreshToken),
                LocalDateTime.now().plus(jwtProperties.refreshTokenValidity())));
        return TokenResponse.bearer(accessToken, refreshToken, tokenProvider.getAccessTokenValiditySeconds(),
                new MeResponse(user.getId(), user.getEmail(), nickname));
    }

    private String findNickname(Long userId) {
        return profileRepository.findByUserId(userId).map(Profile::getNickname).orElse(null);
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static String generateOpaqueToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String hash(String raw) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
