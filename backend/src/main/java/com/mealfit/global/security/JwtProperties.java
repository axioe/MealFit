package com.mealfit.global.security;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * application.yml의 jwt 설정을 읽습니다.
 * 시간은 Duration으로 받아 초·밀리초 혼동을 줄입니다.
 */
@ConfigurationProperties(prefix = "jwt")
public record JwtProperties(
    String secret,
    Duration accessTokenTtl,
    Duration refreshTokenTtl
) {

    /** 필수 설정이 없거나 유효기간이 잘못되면 시작을 중단합니다. */
    public JwtProperties {
        if (secret == null || secret.isBlank()) {
            throw new IllegalArgumentException(
                "JWT_SECRET을 설정해 주세요."
            );
        }

        if (accessTokenTtl == null
            || accessTokenTtl.isZero()
            || accessTokenTtl.isNegative()) {
            throw new IllegalArgumentException(
                "Access Token 유효기간은 0보다 커야 합니다."
            );
        }

        if (refreshTokenTtl == null
            || refreshTokenTtl.isZero()
            || refreshTokenTtl.isNegative()) {
            throw new IllegalArgumentException(
                "Refresh Token 유효기간은 0보다 커야 합니다."
            );
        }
    }
}
