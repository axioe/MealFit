package com.mealfit.global.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;
import org.springframework.stereotype.Component;

/**
 * Refresh Token 원문 생성과 해시 변환을 담당합니다.
 * DB 저장·조회·폐기는 AuthService에서 처리합니다.
 */
@Component
public class RefreshTokenProvider {

    /** 추측하기 어려운 토큰을 만들기 위해 난수 32바이트를 사용합니다. */
    private static final int TOKEN_BYTE_LENGTH = 32;

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * 클라이언트에 전달할 Refresh Token 원문을 생성합니다.
     * URL-safe Base64를 사용하고 끝의 패딩은 생략합니다.
     */
    public String generateToken() {
        byte[] randomBytes = new byte[TOKEN_BYTE_LENGTH];
        secureRandom.nextBytes(randomBytes);

        return Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString(randomBytes);
    }

    /**
     * 토큰 원문을 DB 저장·조회용 SHA-256 해시로 변환합니다.
     * 결과는 RefreshToken.tokenHash에 맞는 64자리 16진수입니다.
     */
    public String hashToken(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new IllegalArgumentException(
                "Refresh Token이 필요합니다."
            );
        }

        try {
            // MessageDigest는 호출마다 생성해 동시 요청 간 공유하지 않습니다.
            MessageDigest digest = MessageDigest.getInstance("SHA-256");

            byte[] hashBytes = digest.digest(
                rawToken.getBytes(StandardCharsets.UTF_8)
            );

            return HexFormat.of().formatHex(hashBytes);
        } catch (NoSuchAlgorithmException exception) {
            // SHA-256은 Java 21의 기본 지원 알고리즘입니다.
            throw new IllegalStateException(
                "SHA-256 해시 기능을 사용할 수 없습니다.",
                exception
            );
        }
    }
}
