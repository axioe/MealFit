package com.mealfit.global.security;

import java.time.Duration;
import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "mealfit.jwt")
public record JwtProperties(
        String secret,
        Duration accessTokenValidity,
        Duration refreshTokenValidity
) {
}
