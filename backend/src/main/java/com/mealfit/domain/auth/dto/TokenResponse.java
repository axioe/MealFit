package com.mealfit.domain.auth.dto;

import com.mealfit.domain.user.dto.MeResponse;

public record TokenResponse(
        String accessToken,
        String refreshToken,
        String tokenType,
        long expiresIn,
        MeResponse user
) {

    public static TokenResponse bearer(String accessToken, String refreshToken, long expiresIn, MeResponse user) {
        return new TokenResponse(accessToken, refreshToken, "Bearer", expiresIn, user);
    }
}
